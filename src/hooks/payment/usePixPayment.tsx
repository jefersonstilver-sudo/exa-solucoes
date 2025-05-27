
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { Json } from '@/integrations/supabase/types';
import { useUserSession } from '@/hooks/useUserSession';

// Define types for payment related data
interface PixData {
  qr_code?: string;
  qr_code_base64?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  ticket_url?: string;
}

export interface PaymentLog {
  payment_method: string;
  payment_status: string;
  payment_id: string;
  payment_created_at?: string;
  pix_data?: PixData;
}

export interface PixPaymentData {
  pedidoId: string;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  paymentId: string;
  valorTotal: number;
  createdAt?: string;
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
      
      // DETECÇÃO INTELIGENTE: Se já está pago, redirecionar
      if (logPagamento?.payment_status === 'approved' || pedido.status === 'pago_pendente_video') {
        console.log("✅ PIX: Pagamento já aprovado, redirecionando para confirmação");
        
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_PROCESSING,
          LogLevel.INFO,
          "Pagamento já aprovado - redirecionando",
          { pedidoId, status: pedido.status }
        );
        
        // Redirecionar após pequeno delay
        setTimeout(() => {
          navigate(`/pedido-confirmado?id=${pedido.id}`);
        }, 1000);
        
        setIsLoading(false);
        return;
      }
      
      if (!logPagamento || logPagamento.payment_method !== 'pix') {
        throw new Error("Método de pagamento inválido ou não encontrado");
      }
      
      // Handle both naming conventions (new and old) for maximum compatibility
      const pixData = logPagamento.pix_data || {};
      
      // Enhanced logging for debugging
      console.log("[usePixPayment] Raw PIX data:", pixData);
      
      // Set the payment data, trying different field naming patterns
      const qrCode = pixData.qrCode || pixData.qr_code || '';
      const qrCodeBase64 = pixData.qrCodeBase64 || pixData.qr_code_base64 || '';
      
      console.log("[usePixPayment] Extracted QR data:", { 
        qrCode: qrCode ? `${qrCode.substring(0, 20)}...` : 'Not found',
        qrCodeBase64: qrCodeBase64 ? `${qrCodeBase64.substring(0, 20)}...` : 'Not found',
        paymentStatus: logPagamento.payment_status
      });
      
      // VALIDAÇÃO: Se não tem QR code válido, mostrar opção de regenerar
      if (!qrCode && !qrCodeBase64) {
        console.warn("[usePixPayment] QR code não encontrado - precisará regenerar");
      }
      
      setPaymentData({
        pedidoId: pedido.id,
        status: logPagamento.payment_status || 'pending',
        qrCode: qrCode,
        qrCodeBase64: qrCodeBase64,
        paymentId: logPagamento.payment_id || '',
        valorTotal: pedido.valor_total,
        createdAt: logPagamento.payment_created_at
      });
      
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
