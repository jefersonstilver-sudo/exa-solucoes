import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendPixPaymentWebhook } from '@/services/pixWebhookService';
import { toast } from 'sonner';

interface PixPaymentDataForPending {
  qrCodeBase64?: string;
  qrCodeText?: string;
  pix_url?: string;
  pix_base64?: string;
  paymentLink?: string;
  transaction_id?: string;
  pedido_id?: string;
  status: 'pending' | 'approved' | 'error';
  error?: string;
}

export const usePixPaymentForPendingOrders = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PixPaymentDataForPending | null>(null);

  const generatePixForPendingOrder = async (pedidoId: string): Promise<boolean> => {
    console.log('[usePixPaymentForPendingOrders] Gerando PIX para pedido pendente:', pedidoId);
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Buscar dados completos do pedido
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select(`
          *,
          users!inner(email, id)
        `)
        .eq('id', pedidoId)
        .single();

      if (pedidoError || !pedido) {
        throw new Error('Pedido não encontrado');
      }

      console.log('[usePixPaymentForPendingOrders] Dados do pedido:', pedido);

      // Buscar dados dos prédios diretamente
      const { data: predios, error: prediosError } = await supabase
        .from('buildings')
        .select('id, nome, preco_base')
        .in('id', pedido.lista_predios || pedido.lista_paineis || []);

      if (prediosError) {
        console.error('[usePixPaymentForPendingOrders] Erro ao buscar prédios:', prediosError);
      }

      // Preparar dados para o webhook (mesmo formato do checkout)
      const prediosData = predios?.map(predio => ({
        id: String(predio.id),
        nome: predio.nome || 'Prédio'
      })) || [];

      const webhookData = {
        cliente_id: pedido.client_id,
        pedido_id: pedido.id,
        transaction_id: pedido.transaction_id || '',
        email: pedido.users.email || '',
        nome: pedido.users.email || 'Usuário',
        plano_escolhido: `Plano ${pedido.plano_meses} ${pedido.plano_meses === 1 ? 'mês' : 'meses'}`,
        periodo_meses: pedido.plano_meses,
        predios_selecionados: prediosData,
        valor_total: String(pedido.valor_total.toFixed(2)),
        periodo_exibicao: {
          inicio: new Date().toISOString(),
          fim: new Date(Date.now() + pedido.plano_meses * 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      console.log('[usePixPaymentForPendingOrders] Enviando para webhook:', webhookData);

      // Enviar para webhook PIX (mesmo serviço do checkout)
      const pixResult = await sendPixPaymentWebhook(webhookData);

      if (!pixResult.success) {
        throw new Error(pixResult.error || 'Erro ao gerar PIX');
      }

      // Salvar dados PIX no pedido (mesmo comportamento do checkout)
      const pixDataToSave = {
        qrCodeBase64: pixResult.qrCodeBase64 || pixResult.pix_base64,
        qrCodeText: pixResult.qrCodeText || pixResult.pix_url,
        pix_base64: pixResult.pix_base64,
        pix_url: pixResult.pix_url,
        paymentLink: pixResult.paymentLink,
        transaction_id: pixResult.transaction_id,
        generated_at: new Date().toISOString(),
        regenerated: true // flag para indicar que foi regenerado
      };

      // Atualizar log_pagamento do pedido
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({ 
          log_pagamento: pixDataToSave
        })
        .eq('id', pedidoId);

      if (updateError) {
        console.error('[usePixPaymentForPendingOrders] Erro ao salvar PIX no pedido:', updateError);
      }

      // Preparar dados para o componente
      const finalPaymentData: PixPaymentDataForPending = {
        qrCodeBase64: pixResult.qrCodeBase64 || pixResult.pix_base64,
        qrCodeText: pixResult.qrCodeText || pixResult.pix_url,
        pix_url: pixResult.pix_url,
        pix_base64: pixResult.pix_base64,
        paymentLink: pixResult.paymentLink,
        transaction_id: pixResult.transaction_id || pedido.transaction_id,
        pedido_id: pedidoId,
        status: 'pending'
      };

      setPaymentData(finalPaymentData);
      
      console.log('[usePixPaymentForPendingOrders] PIX gerado com sucesso:', finalPaymentData);
      toast.success('QR Code PIX gerado com sucesso!');
      
      return true;

    } catch (error: any) {
      console.error('[usePixPaymentForPendingOrders] Erro:', error);
      const errorMessage = error.message || 'Erro ao gerar PIX';
      setError(errorMessage);
      toast.error(errorMessage);
      
      setPaymentData({
        status: 'error',
        error: errorMessage,
        pedido_id: pedidoId
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPaymentStatus = async (): Promise<void> => {
    if (!paymentData?.pedido_id) return;

    try {
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .select('status')
        .eq('id', paymentData.pedido_id)
        .single();

      if (!error && pedido && pedido.status === 'pago') {
        setPaymentData(prev => prev ? { ...prev, status: 'approved' } : null);
        toast.success('Pagamento confirmado!');
      }
    } catch (error) {
      console.error('[usePixPaymentForPendingOrders] Erro ao verificar status:', error);
    }
  };

  return {
    isLoading,
    error,
    paymentData,
    generatePixForPendingOrder,
    refreshPaymentStatus
  };
};