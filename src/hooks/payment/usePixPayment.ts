
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { toast } from 'sonner';

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
}

export interface PixPaymentData {
  status: string;
  qrCodeBase64?: string;
  qrCodeText?: string;
  paymentId?: string;
  totalAmount?: string;
}

export const usePixPayment = (pedidoId: string | null) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null);
  
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

      // Cast log_pagamento to the PaymentLog type for safe access
      const logPagamento = pedidoData.log_pagamento as unknown as PaymentLog || {};
      
      // Extract payment information safely with optional chaining
      const pixData: PixPaymentData = {
        status: pedidoData.status,
        qrCodeBase64: logPagamento?.pix_data?.qr_code_base64,
        qrCodeText: logPagamento?.pix_data?.qr_code,
        paymentId: logPagamento?.payment_id,
        totalAmount: pedidoData.valor_total?.toString() || '0'
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
    setIsLoading(true);
    await fetchPaymentData();
  };

  return {
    isLoading,
    error,
    paymentData,
    refreshPaymentStatus
  };
};

export default usePixPayment;
