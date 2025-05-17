
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { Json } from '@/integrations/supabase/types';
import { useUserSession } from '@/hooks/useUserSession';

// Define types for payment related data
interface PixData {
  qr_code: string;
  qr_code_base64: string;
}

export interface PaymentLog {
  payment_method: string;
  payment_status: string;
  payment_id: string;
  pix_data?: PixData;
}

export interface PixPaymentData {
  pedidoId: string;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  paymentId: string;
  valorTotal: number;
}

export const usePixPayment = (pedidoId: string | null) => {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: isSessionLoading, user } = useUserSession();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null);
  
  // Fetch payment data from Supabase
  const fetchPaymentData = async () => {
    if (!pedidoId) {
      setError("ID do pedido não encontrado");
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .limit(1);
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Pedido não encontrado");
      
      const pedido = data[0];
      
      // Check if user is authorized to view this payment
      if (pedido.client_id !== user?.id) {
        throw new Error("Você não tem permissão para visualizar este pagamento");
      }
      
      // We need to safely cast the log_pagamento to PaymentLog
      const logPagamento = pedido.log_pagamento as unknown as PaymentLog;
      
      if (!logPagamento || logPagamento.payment_method !== 'pix') {
        throw new Error("Método de pagamento inválido ou não encontrado");
      }
      
      // Set the payment data
      setPaymentData({
        pedidoId: pedido.id,
        status: logPagamento.payment_status || 'pending',
        qrCode: logPagamento.pix_data?.qr_code || '',
        qrCodeBase64: logPagamento.pix_data?.qr_code_base64 || '',
        paymentId: logPagamento.payment_id || '',
        valorTotal: pedido.valor_total
      });
      
      // If payment is already approved, redirect to confirmation page after a short delay
      if (logPagamento.payment_status === 'approved') {
        setTimeout(() => {
          navigate(`/pedido-confirmado?id=${pedido.id}`);
        }, 3000);
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error fetching payment data:", err);
      setError(err.message || "Erro ao carregar dados do pagamento");
      setIsLoading(false);
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Erro ao carregar dados do PIX: ${err.message}`,
        { pedidoId, error: String(err) }
      );
    }
  };
  
  // Refresh the payment status
  const refreshPaymentStatus = async (): Promise<void> => {
    if (!pedidoId) return;
    
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .limit(1);
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Pedido não encontrado");
      
      const pedido = data[0];
      // We need to safely cast the log_pagamento to PaymentLog
      const logPagamento = pedido.log_pagamento as unknown as PaymentLog;
      
      // Update local payment data
      setPaymentData(prev => prev ? ({
        ...prev,
        status: logPagamento.payment_status || 'pending',
      }) : null);
      
      // If payment is approved, redirect to confirmation page
      if (logPagamento.payment_status === 'approved') {
        toast.success("Pagamento aprovado! Redirecionando...");
        setTimeout(() => {
          navigate(`/pedido-confirmado?id=${pedido.id}`);
        }, 1500);
      }
    } catch (err: any) {
      console.error("Error refreshing payment status:", err);
      toast.error("Erro ao atualizar status do pagamento");
    }
  };
  
  // Check authentication and load payment data
  useEffect(() => {
    if (isSessionLoading) return;
    
    if (!isLoggedIn) {
      navigate('/login?redirect=/checkout');
      return;
    }
    
    fetchPaymentData();
  }, [isSessionLoading, isLoggedIn, pedidoId]);
  
  return {
    isLoading,
    error,
    paymentData,
    refreshPaymentStatus,
  };
};
