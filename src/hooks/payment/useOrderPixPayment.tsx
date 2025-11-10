import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logSystemEvent } from '@/utils/auditLogger';
import { sendPixPaymentWebhook } from '@/services/pixWebhookService';
import { PixWebhookData } from '@/types/pixWebhook';

interface Order {
  id: string;
  valor_total: number;
  status: string;
  client_id: string;
}

interface PixPaymentResult {
  success: boolean;
  qrCodeBase64?: string;
  qrCode?: string;
  paymentId?: string;
  error?: string;
}

export const useOrderPixPayment = () => {
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);

  const generatePixForOrder = useCallback(async (order: Order): Promise<PixPaymentResult> => {
    setIsGeneratingPix(true);

    try {
      console.log('🎯 [OrderPixPayment] Gerando PIX para pedido:', order.id);

      logSystemEvent('ORDER_PIX_GENERATION_START', {
        orderId: order.id,
        valorTotal: order.valor_total,
        status: order.status
      });

      // Buscar dados do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('nome, email, cpf')
        .eq('id', order.client_id)
        .single();

      if (userError || !userData) {
        throw new Error('Erro ao buscar dados do cliente');
      }

      // Preparar dados para webhook n8n (dados mínimos aceitos)
      const webhookData: PixWebhookData = {
        cliente_id: order.client_id,
        pedido_id: order.id,
        email: userData.email || 'cliente@email.com',
        nome: userData.nome || 'Cliente',
        plano_escolhido: 'Plano Standard',
        periodo_meses: 1,
        predios_selecionados: [{ id: '1', nome: 'Prédio Padrão' }],
        valor_total: order.valor_total.toString(),
        periodo_exibicao: {
          inicio: new Date().toISOString(),
          fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      console.log('📡 [OrderPixPayment] Enviando para webhook n8n:', webhookData);

      // Chamar webhook n8n para gerar PIX
      const webhookResponse = await sendPixPaymentWebhook(webhookData);

      if (!webhookResponse.success) {
        throw new Error(webhookResponse.error || 'Falha ao gerar PIX');
      }

      // Atualizar pedido com dados do PIX
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({
          log_pagamento: {
            pixData: {
              qrCodeBase64: webhookResponse.qrCodeBase64 || webhookResponse.pix_base64,
              qrCode: webhookResponse.qrCodeText || webhookResponse.pix_url,
              paymentId: webhookResponse.transaction_id,
              status: 'pending'
            }
          }
        })
        .eq('id', order.id);

      if (updateError) {
        console.warn('⚠️ [OrderPixPayment] Erro ao atualizar pedido, mas PIX foi gerado:', updateError);
      }

      console.log('✅ [OrderPixPayment] PIX gerado com sucesso');

      logSystemEvent('ORDER_PIX_GENERATION_SUCCESS', {
        orderId: order.id,
        paymentId: webhookResponse.transaction_id
      });

      toast.success('QR Code PIX gerado com sucesso!');

      return {
        success: true,
        qrCodeBase64: webhookResponse.qrCodeBase64 || webhookResponse.pix_base64,
        qrCode: webhookResponse.qrCodeText || webhookResponse.pix_url,
        paymentId: webhookResponse.transaction_id
      };

    } catch (error: any) {
      console.error('❌ [OrderPixPayment] Erro ao gerar PIX:', error);

      logSystemEvent('ORDER_PIX_GENERATION_ERROR', {
        orderId: order.id,
        error: error.message
      }, 'ERROR');

      toast.error(`Erro ao gerar PIX: ${error.message}`);

      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsGeneratingPix(false);
    }
  }, []);

  return {
    generatePixForOrder,
    isGeneratingPix
  };
};