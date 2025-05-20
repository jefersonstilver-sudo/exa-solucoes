
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

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

      // Safely handle log_pagamento field
      const logPagamento = pedidoData.log_pagamento || {};
      
      // Extract payment information safely
      const pixData: PixPaymentData = {
        status: pedidoData.status,
        qrCodeBase64: typeof logPagamento === 'object' && logPagamento.pix_data ? 
                      logPagamento.pix_data.qr_code_base64 : '',
        qrCodeText: typeof logPagamento === 'object' && logPagamento.pix_data ? 
                    logPagamento.pix_data.qr_code : '',
        paymentId: typeof logPagamento === 'object' ? logPagamento.payment_id : '',
        totalAmount: pedidoData.valor_total?.toString() || '0'
      };

      setPaymentData(pixData);
      setIsLoading(false);
      
      // Log payment data loaded event
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_STATUS,
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
