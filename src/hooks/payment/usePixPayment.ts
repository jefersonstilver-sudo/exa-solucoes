
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { toast } from 'sonner';
import { useUserSession } from '@/hooks/useUserSession';

// Define more specific types for payment related data
interface PixData {
  qr_code?: string;
  qr_code_base64?: string;
}

interface PaymentLog {
  payment_method?: string;
  payment_status?: string;
  payment_id?: string;
  pix_data?: PixData;
  created_at?: string;
}

export interface PixPaymentData {
  status: string;
  qrCodeBase64?: string;
  qrCode?: string; // Changed from qrCodeText to match usage in components
  paymentId?: string;
  totalAmount?: string;
  valorTotal?: number; // Added to match usage in components
  createdAt?: string; // Add creation timestamp for expiration check
}

export const usePixPayment = (pedidoId: string | null) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null);
  const { user } = useUserSession();
  const navigate = useNavigate();
  
  // Function to get payment data
  const fetchPaymentData = async () => {
    try {
      if (!pedidoId) {
        setError("ID do pedido não encontrado");
        setIsLoading(false);
        return;
      }

      // Fetch payment data from Supabase
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();

      if (pedidoError) {
        console.error("Erro ao buscar pedido:", pedidoError);
        setError("Erro ao buscar informações do pagamento");
        setIsLoading(false);
        return;
      }

      if (!pedidoData) {
        setError("Pedido não encontrado");
        setIsLoading(false);
        return;
      }
      
      // Verify user permission
      if (user && pedidoData.client_id !== user.id) {
        setError("Você não tem permissão para visualizar este pagamento");
        setIsLoading(false);
        return;
      }

      // Cast log_pagamento to the PaymentLog type for safe access
      const logPagamento = pedidoData.log_pagamento as unknown as PaymentLog || {};
      
      // Extract payment information safely with optional chaining
      const pixData: PixPaymentData = {
        status: pedidoData.status === 'pago' || logPagamento?.payment_status === 'approved' 
          ? 'approved' 
          : logPagamento?.payment_status || 'pending',
        qrCodeBase64: logPagamento?.pix_data?.qr_code_base64,
        qrCode: logPagamento?.pix_data?.qr_code, // Note the change here
        paymentId: logPagamento?.payment_id,
        valorTotal: pedidoData.valor_total || 0, // Added to match usage
        totalAmount: pedidoData.valor_total?.toString() || '0',
        createdAt: logPagamento?.created_at || pedidoData.created_at
      };

      setPaymentData(pixData);
      setIsLoading(false);
      
      // Log payment data loaded event
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_PROCESSING,
        LogLevel.INFO,
        `PIX payment data loaded for pedido ${pedidoId}`,
        { status: pixData.status, paymentId: pixData.paymentId }
      );
      
      // If payment is approved, update notification
      if (pixData.status === 'approved') {
        toast.success("Pagamento já aprovado!");
      }
    } catch (err) {
      console.error("Error loading payment data:", err);
      setError("Erro ao carregar dados do pagamento");
      setIsLoading(false);
    }
  };

  // Load payment data on mount
  useEffect(() => {
    fetchPaymentData();
  }, [pedidoId]);

  // Function to refresh payment status
  const refreshPaymentStatus = async () => {
    try {
      if (!pedidoId) {
        throw new Error("ID do pedido não encontrado");
      }
      
      // Fetch latest payment data
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();
      
      if (pedidoError) {
        throw new Error("Erro ao buscar informações do pagamento");
      }

      if (!pedidoData) {
        throw new Error("Pedido não encontrado");
      }
      
      // Cast log_pagamento to the PaymentLog type for safe access
      const logPagamento = pedidoData.log_pagamento as unknown as PaymentLog || {};
      
      // Check payment status
      const newStatus = pedidoData.status === 'pago' || logPagamento?.payment_status === 'approved' 
        ? 'approved' 
        : logPagamento?.payment_status || 'pending';
      
      // Update payment data state
      setPaymentData(prev => {
        if (!prev) return null;
        
        const updatedData = {
          ...prev,
          status: newStatus
        };
        
        // Show notification for payment approved
        if (newStatus === 'approved' && prev.status !== 'approved') {
          toast.success("Pagamento aprovado!");
          
          // Log payment approved
          logCheckoutEvent(
            CheckoutEvent.PAYMENT_PROCESSING,
            LogLevel.INFO,
            `PIX payment approved for pedido ${pedidoId}`,
            { paymentId: prev.paymentId }
          );
        }
        
        return updatedData;
      });
      
      // Return the new status in case caller needs it
      return newStatus;
    } catch (error: any) {
      console.error("Error refreshing payment status:", error);
      toast.error("Erro ao atualizar status do pagamento");
      throw error;
    }
  };

  return {
    isLoading,
    error,
    paymentData,
    refreshPaymentStatus
  };
};

export default usePixPayment;
