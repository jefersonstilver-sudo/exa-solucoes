
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';
import { filterEq, unwrapData } from '@/utils/supabaseUtils';

export interface PixPaymentData {
  qrCodeBase64: string;
  qrCode: string;
  paymentId: string;
  status: string;
  orderId?: string;
  totalAmount?: number;
  expiresAt?: string;
}

interface UsePixPaymentResult {
  isLoading: boolean;
  error: string | null;
  paymentData: PixPaymentData | null;
  refreshPaymentStatus: () => Promise<void>;
}

export const usePixPayment = (pedidoId: string | null): UsePixPaymentResult => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null);

  useEffect(() => {
    const fetchPixData = async () => {
      if (!pedidoId) {
        setError('ID do pedido é obrigatório');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Buscar dados do pedido
        const { data, error } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', filterEq(pedidoId))
          .single();
        
        if (error) throw error;
        
        // Ensure we have valid data
        const order = unwrapData(data);
        if (!order) throw new Error('Não foi possível obter dados do pedido');
        
        // Verificar se o cliente é o mesmo que fez o pedido
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (userId !== order.client_id) {
          throw new Error('Você não tem permissão para visualizar este pedido');
        }
        
        // Obter dados de pagamento PIX
        const logPagamento = order.log_pagamento || {};
        
        if (!logPagamento.payment_method || logPagamento.payment_method !== 'pix') {
          throw new Error('Este pedido não foi gerado com método PIX');
        }
        
        // Verificar se temos os dados do PIX
        if (!logPagamento.pix_data) {
          throw new Error('Dados de pagamento PIX não encontrados');
        }
        
        // Montar dados do pagamento PIX
        setPaymentData({
          qrCodeBase64: logPagamento.pix_data.qr_code_base64 || '',
          qrCode: logPagamento.pix_data.qr_code || '',
          paymentId: logPagamento.payment_id || '',
          status: logPagamento.payment_status || 'pending',
          orderId: order.id,
          totalAmount: parseFloat(order.valor_total) || 0,
          expiresAt: logPagamento.expires_at || new Date(new Date().getTime() + 30 * 60000).toISOString()
        });
        
        setIsLoading(false);
        
        // Log de eventos para depuração
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_UPDATE,
          LogLevel.INFO,
          'Dados PIX carregados com sucesso',
          { 
            pedidoId, 
            status: logPagamento.payment_status || 'pending',
            hasQRCode: !!logPagamento.pix_data.qr_code 
          }
        );
        
      } catch (err: any) {
        console.error('Erro ao carregar dados do PIX:', err);
        setError(err.message || 'Erro ao carregar dados do pagamento PIX');
        setIsLoading(false);
        
        // Log do erro para depuração
        logCheckoutEvent(
          CheckoutEvent.PAYMENT_ERROR,
          LogLevel.ERROR,
          `Erro ao carregar dados PIX: ${err.message}`,
          { pedidoId, error: String(err) }
        );
        
        toast({
          variant: "destructive",
          title: "Erro",
          description: err.message || "Erro ao carregar dados do pagamento"
        });
      }
    };
    
    fetchPixData();
  }, [pedidoId, toast]);
  
  // Atualizar status do pagamento
  const refreshPaymentStatus = async (): Promise<void> => {
    if (!pedidoId) return;
    
    try {
      setIsLoading(true);
      
      // Buscar dados atualizados do pedido
      const { data, error } = await supabase
        .from('pedidos')
        .select('log_pagamento')
        .eq('id', filterEq(pedidoId))
        .single();
      
      if (error) throw error;
      
      // Ensure we have valid data
      const order = unwrapData(data);
      if (!order) throw new Error('Não foi possível obter dados do pedido');
      
      // Atualizar status do pagamento
      const logPagamento = order.log_pagamento || {};
      
      if (paymentData) {
        setPaymentData({
          ...paymentData,
          status: logPagamento.payment_status || paymentData.status || 'pending'
        });
      }
      
      // Log de eventos para depuração
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_UPDATE,
        LogLevel.INFO,
        'Status do pagamento atualizado',
        { pedidoId, status: logPagamento.payment_status || 'unknown' }
      );
      
      setIsLoading(false);
      return;
      
    } catch (err: any) {
      console.error('Erro ao atualizar status do pagamento:', err);
      setIsLoading(false);
      
      // Log do erro para depuração
      logCheckoutEvent(
        CheckoutEvent.PAYMENT_ERROR,
        LogLevel.ERROR,
        `Erro ao atualizar status: ${err.message}`,
        { pedidoId, error: String(err) }
      );
    }
  };
  
  return {
    isLoading,
    error,
    paymentData,
    refreshPaymentStatus
  };
};
