
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { unwrapData } from '@/utils/supabaseUtils';

export interface PixPaymentData {
  qrCodeBase64: string;
  qrCode: string;
  paymentId: string;
  status: string;
  pedidoId: string;
  valorTotal: number;
}

interface UsePixPaymentResult {
  isLoading: boolean;
  error: string | null;
  paymentData: PixPaymentData | null;
  refreshPaymentStatus: () => Promise<void>;
}

export const usePixPayment = (pedidoId: string | null): UsePixPaymentResult => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null);

  const fetchPaymentData = useCallback(async () => {
    if (!pedidoId) {
      setError('ID do pedido não fornecido');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch order data
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();

      if (pedidoError) throw pedidoError;

      const pedido = unwrapData(pedidoData);
      if (!pedido) throw new Error('Pedido não encontrado');

      // Type assertion for safer access
      const pedidoTyped = pedido as any;

      // Check if we have payment data in log_pagamento
      const paymentLog = pedidoTyped.log_pagamento;
      
      if (!paymentLog || typeof paymentLog !== 'object') {
        throw new Error('Dados de pagamento PIX não encontrados');
      }

      // Type assertion for payment log
      const paymentLogTyped = paymentLog as any;
      
      // Create the payment data object
      const pixData: PixPaymentData = {
        qrCodeBase64: paymentLogTyped.qr_code_base64 || '',
        qrCode: paymentLogTyped.qr_code || '',
        paymentId: paymentLogTyped.payment_id || '',
        status: paymentLogTyped.status || 'pending',
        pedidoId: pedidoTyped.id,
        valorTotal: pedidoTyped.valor_total || 0
      };

      setPaymentData(pixData);

      logCheckoutEvent(
        CheckoutEvent.PAYMENT_UPDATE,
        LogLevel.INFO,
        'Dados de pagamento PIX carregados com sucesso',
        { 
          pedidoId,
          status: pixData.status,
          hasQRCode: !!pixData.qrCodeBase64
        }
      );

    } catch (err: any) {
      console.error('Erro ao buscar dados de pagamento:', err);
      setError(err.message || 'Erro ao carregar dados de pagamento PIX');
      
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        'Erro ao buscar dados de pagamento PIX',
        { 
          pedidoId,
          error: err.message 
        }
      );
    } finally {
      setIsLoading(false);
    }
  }, [pedidoId]);

  const refreshPaymentStatus = useCallback(async () => {
    if (!pedidoId || !paymentData) return;

    try {
      // Check payment status in the database
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .select('log_pagamento, status')
        .eq('id', pedidoId)
        .single();

      if (pedidoError) throw pedidoError;

      const pedido = unwrapData(pedidoData);
      if (!pedido) return;

      // Type assertion for safer access
      const pedidoTyped = pedido as any;
      const paymentLog = pedidoTyped.log_pagamento;

      if (paymentLog && typeof paymentLog === 'object') {
        const paymentLogTyped = paymentLog as any;
        
        setPaymentData(prev => prev ? {
          ...prev,
          status: paymentLogTyped.status || prev.status
        } : null);

        logCheckoutEvent(
          CheckoutEvent.PAYMENT_UPDATE,
          LogLevel.INFO,
          'Status de pagamento atualizado',
          { 
            pedidoId,
            newStatus: paymentLogTyped.status 
          }
        );
      }

    } catch (err: any) {
      console.error('Erro ao atualizar status de pagamento:', err);
    }
  }, [pedidoId, paymentData]);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  return {
    isLoading,
    error,
    paymentData,
    refreshPaymentStatus
  };
};
