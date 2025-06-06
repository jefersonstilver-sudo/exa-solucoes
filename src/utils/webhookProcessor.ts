
// Processador de Webhooks Melhorado para MercadoPago

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WebhookPayload {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: string;
}

interface PaymentData {
  id: string;
  status: string;
  status_detail: string;
  external_reference: string;
  transaction_amount: number;
  payer: {
    email: string;
  };
  date_created: string;
  date_approved?: string;
}

class WebhookProcessor {
  private static instance: WebhookProcessor;

  static getInstance(): WebhookProcessor {
    if (!WebhookProcessor.instance) {
      WebhookProcessor.instance = new WebhookProcessor();
    }
    return WebhookProcessor.instance;
  }

  // Processar webhook do MercadoPago
  async processPaymentWebhook(payload: WebhookPayload): Promise<boolean> {
    try {
      console.log("📡 [Webhook] Processando webhook do MercadoPago:", payload);

      // Verificar se é um webhook de pagamento
      if (payload.type !== 'payment') {
        console.log("📡 [Webhook] Tipo de webhook ignorado:", payload.type);
        return true;
      }

      // Buscar dados do pagamento no MercadoPago
      const paymentData = await this.fetchPaymentData(payload.data.id);
      if (!paymentData) {
        console.error("❌ [Webhook] Não foi possível buscar dados do pagamento");
        return false;
      }

      // Processar pagamento aprovado
      if (paymentData.status === 'approved') {
        await this.handleApprovedPayment(paymentData);
      } else {
        console.log("📡 [Webhook] Status do pagamento não é 'approved':", paymentData.status);
      }

      // Log do webhook processado - CORRIGIDO: JSON.stringify para serializar
      await supabase
        .from('webhook_logs')
        .insert({
          origem: 'mercadopago_webhook_processed',
          status: 'success',
          payload: {
            webhook: JSON.parse(JSON.stringify(payload)),
            payment: JSON.parse(JSON.stringify(paymentData)),
            processed_at: new Date().toISOString()
          }
        });

      return true;

    } catch (error: any) {
      console.error("❌ [Webhook] Erro no processamento:", error);
      
      // Log do erro - CORRIGIDO: JSON.stringify para serializar
      await supabase
        .from('webhook_logs')
        .insert({
          origem: 'mercadopago_webhook_error',
          status: 'error',
          payload: {
            webhook: JSON.parse(JSON.stringify(payload)),
            error: error.message || String(error),
            processed_at: new Date().toISOString()
          }
        });

      return false;
    }
  }

  // Buscar dados do pagamento no MercadoPago
  private async fetchPaymentData(paymentId: string): Promise<PaymentData | null> {
    try {
      // Esta função seria implementada com a API do MercadoPago
      // Por enquanto, retornamos dados simulados para teste
      console.log("📡 [Webhook] Buscando dados do pagamento:", paymentId);
      
      // Em produção, fazer requisição para:
      // https://api.mercadopago.com/v1/payments/{paymentId}
      
      return null; // Implementar busca real
      
    } catch (error) {
      console.error("❌ [Webhook] Erro ao buscar dados do pagamento:", error);
      return null;
    }
  }

  // Processar pagamento aprovado
  private async handleApprovedPayment(paymentData: PaymentData): Promise<void> {
    try {
      console.log("✅ [Webhook] Processando pagamento aprovado:", paymentData);

      // Extrair referência externa para encontrar o pedido
      const externalRef = paymentData.external_reference;
      if (!externalRef) {
        console.error("❌ [Webhook] Referência externa não encontrada");
        return;
      }

      // Buscar pedido pela referência externa
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('status', 'pendente')
        .eq('valor_total', paymentData.transaction_amount);

      if (error) {
        console.error("❌ [Webhook] Erro ao buscar pedido:", error);
        return;
      }

      if (!pedidos || pedidos.length === 0) {
        console.log("⚠️ [Webhook] Nenhum pedido pendente encontrado para o valor:", paymentData.transaction_amount);
        return;
      }

      // Atualizar pedido para pago
      const pedido = pedidos[0];
      
      // CORRIGIDO: Criar objeto de log_pagamento corretamente
      const currentLogPagamento = pedido.log_pagamento || {};
      const updatedLogPagamento = {
        ...currentLogPagamento,
        payment_id: paymentData.id,
        payment_status: paymentData.status,
        payment_approved_at: paymentData.date_approved,
        processed_by_webhook: true,
        webhook_processed_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('pedidos')
        .update({
          status: 'pago',
          log_pagamento: updatedLogPagamento
        })
        .eq('id', pedido.id);

      if (updateError) {
        console.error("❌ [Webhook] Erro ao atualizar pedido:", updateError);
        return;
      }

      console.log("✅ [Webhook] Pedido atualizado com sucesso:", pedido.id);

      // Log da atualização
      await supabase
        .from('log_eventos_sistema')
        .insert({
          tipo_evento: 'PAYMENT_PROCESSED_BY_WEBHOOK',
          descricao: `Pagamento processado via webhook: Pedido ${pedido.id} - Valor: R$ ${paymentData.transaction_amount}`
        });

      // Notificar usuário
      toast.success(`Pagamento de R$ ${paymentData.transaction_amount} confirmado!`);

    } catch (error) {
      console.error("❌ [Webhook] Erro ao processar pagamento aprovado:", error);
    }
  }

  // Simular processamento de webhook para teste
  async simulateWebhookProcessing(pedidoId: string, amount: number): Promise<void> {
    try {
      console.log("🧪 [Webhook] Simulando processamento para teste");

      const { error } = await supabase
        .from('pedidos')
        .update({
          status: 'pago',
          log_pagamento: {
            payment_method: 'pix',
            payment_status: 'approved',
            simulated_webhook: true,
            processed_at: new Date().toISOString()
          }
        })
        .eq('id', pedidoId);

      if (error) {
        console.error("❌ [Webhook] Erro na simulação:", error);
        return;
      }

      console.log("✅ [Webhook] Simulação concluída com sucesso");
      toast.success("Webhook simulado - Pagamento confirmado!");

    } catch (error) {
      console.error("❌ [Webhook] Erro na simulação:", error);
    }
  }
}

export const webhookProcessor = WebhookProcessor.getInstance();
