import { useState } from 'react';
import { sendPixPaymentWebhook } from '@/services/pixWebhookService';
import { getUserInfo } from '@/services/userInfoService';
import { toast } from 'sonner';

interface OrderPixPaymentData {
  qrCodeBase64?: string;
  qrCodeText?: string;
  pix_base64?: string;
  pix_url?: string;
  paymentLink?: string;
  pedido_id?: string;
  transaction_id?: string;
}

interface OrderPixPaymentResult {
  success: boolean;
  pixData?: OrderPixPaymentData;
  error?: string;
}

export const useOrderPixPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const generatePixForOrder = async (order: any): Promise<OrderPixPaymentResult> => {
    console.log('[useOrderPixPayment] Gerando PIX para pedido específico:', {
      orderId: order.id,
      status: order.status,
      valor: order.valor_total,
      client_id: order.client_id,
      timestamp: new Date().toISOString()
    });

    if (!order?.id) {
      return { success: false, error: "Pedido inválido" };
    }

    if (order.status !== 'pendente') {
      return { success: false, error: "Pedido não está pendente de pagamento" };
    }

    if (!order.client_id) {
      return { success: false, error: "Client ID não encontrado no pedido" };
    }

    setIsProcessing(true);

    try {
      // Buscar informações reais do usuário
      console.log('[useOrderPixPayment] Buscando dados do usuário:', order.client_id);
      const userInfo = await getUserInfo(order.client_id);
      
      if (!userInfo) {
        console.error('[useOrderPixPayment] Usuário não encontrado:', order.client_id);
        return { success: false, error: "Dados do usuário não encontrados" };
      }

      console.log('[useOrderPixPayment] Dados do usuário obtidos:', userInfo);

      // Preparar dados do webhook baseados no pedido existente
      const webhookData = {
        cliente_id: order.client_id,
        pedido_id: order.id,
        transaction_id: order.transaction_id || `order_${order.id}`,
        email: userInfo.email || 'cliente@email.com',
        nome: userInfo.nome || 'Cliente',
        plano_escolhido: `Plano ${order.plano_meses} ${order.plano_meses === 1 ? 'mês' : 'meses'}`,
        periodo_meses: order.plano_meses,
        predios_selecionados: (order.lista_paineis || []).map((panelId: string, index: number) => ({
          id: panelId,
          nome: `Painel ${index + 1}`
        })),
        valor_total: String(order.valor_total.toFixed(2)),
        periodo_exibicao: {
          inicio: order.data_inicio || new Date().toISOString(),
          fim: order.data_fim || new Date(Date.now() + order.plano_meses * 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };

      console.log('[useOrderPixPayment] Enviando dados para webhook:', webhookData);

      // Enviar para webhook PIX
      const pixResult = await sendPixPaymentWebhook(webhookData);

      console.log('[useOrderPixPayment] Resultado do webhook:', {
        success: pixResult.success,
        hasQrCode: !!pixResult.qrCodeBase64 || !!pixResult.pix_base64,
        hasPixText: !!pixResult.qrCodeText || !!pixResult.pix_url,
        error: pixResult.error
      });

      if (!pixResult.success) {
        console.error('[useOrderPixPayment] Webhook falhou:', pixResult.error);
        toast.error(`Erro ao gerar PIX: ${pixResult.error}`);
        return {
          success: false,
          error: `Erro no webhook: ${pixResult.error}`
        };
      }

      // Unificar dados PIX
      const finalPixData = {
        qrCodeBase64: pixResult.qrCodeBase64 || pixResult.pix_base64,
        qrCodeText: pixResult.qrCodeText || pixResult.pix_url,
        pix_base64: pixResult.pix_base64,
        pix_url: pixResult.pix_url,
        paymentLink: pixResult.paymentLink,
        pedido_id: pixResult.pedido_id || order.id,
        transaction_id: pixResult.transaction_id || order.transaction_id
      };

      console.log('[useOrderPixPayment] PIX gerado com sucesso:', finalPixData);
      toast.success('PIX gerado com sucesso!');

      return {
        success: true,
        pixData: finalPixData
      };

    } catch (error: any) {
      console.error('[useOrderPixPayment] Erro capturado:', error);
      const errorMessage = `Erro ao gerar PIX: ${error.message}`;
      toast.error(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    generatePixForOrder,
    isProcessing
  };
};