
// Utilitários de Debug PIX para investigar pagamentos perdidos

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PixDebugResult {
  success: boolean;
  findings: string[];
  recommendations: string[];
  data?: any;
}

export const pixDebugUtils = {
  // Investigar pagamentos perdidos
  async investigateLostPayments(timeRange: number = 24): Promise<PixDebugResult> {
    try {
      console.log(`🔍 [PIX Debug] Investigando pagamentos perdidos das últimas ${timeRange} horas`);
      
      const hoursAgo = new Date(Date.now() - timeRange * 60 * 60 * 1000).toISOString();
      
      // Buscar pedidos pendentes recentes
      const { data: pendingOrders, error: ordersError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('status', 'pendente')
        .gte('created_at', hoursAgo)
        .order('created_at', { ascending: false });

      if (ordersError) {
        throw ordersError;
      }

      // Buscar webhooks recebidos
      const { data: webhooks, error: webhooksError } = await supabase
        .from('webhook_logs')
        .select('*')
        .gte('created_at', hoursAgo)
        .order('created_at', { ascending: false });

      if (webhooksError) {
        throw webhooksError;
      }

      const findings: string[] = [];
      const recommendations: string[] = [];

      // Análises
      findings.push(`Encontrados ${pendingOrders?.length || 0} pedidos pendentes`);
      findings.push(`Encontrados ${webhooks?.length || 0} webhooks recebidos`);

      if ((pendingOrders?.length || 0) > 0 && (webhooks?.length || 0) === 0) {
        findings.push('⚠️ PROBLEMA: Pedidos pendentes sem webhooks correspondentes');
        recommendations.push('Verificar configuração de webhooks no MercadoPago');
        recommendations.push('Testar conectividade da URL de webhook');
      }

      if ((webhooks?.length || 0) > 0) {
        const mercadoPagoWebhooks = webhooks?.filter(w => 
          w.origem?.includes('mercadopago') || 
          w.payload?.type === 'payment'
        ) || [];
        
        findings.push(`Encontrados ${mercadoPagoWebhooks.length} webhooks do MercadoPago`);
        
        if (mercadoPagoWebhooks.length === 0) {
          recommendations.push('Webhooks recebidos mas não são do MercadoPago - verificar origem');
        }
      }

      return {
        success: true,
        findings,
        recommendations,
        data: {
          pendingOrders: pendingOrders?.length || 0,
          totalWebhooks: webhooks?.length || 0,
          orders: pendingOrders,
          webhooks: webhooks
        }
      };

    } catch (error: any) {
      console.error('❌ [PIX Debug] Erro na investigação:', error);
      return {
        success: false,
        findings: [`Erro na investigação: ${error.message}`],
        recommendations: ['Verificar logs do sistema', 'Contatar suporte técnico']
      };
    }
  },

  // Testar conectividade de webhook
  async testWebhookConnectivity(): Promise<PixDebugResult> {
    try {
      console.log('🔗 [PIX Debug] Testando conectividade de webhook');
      
      const findings: string[] = [];
      const recommendations: string[] = [];

      // Testar se a edge function está respondendo
      const { data, error } = await supabase.functions.invoke('mercadopago-webhook', {
        body: {
          type: 'test',
          action: 'connectivity_test',
          data: { id: 'test-connection' }
        }
      });

      if (error) {
        findings.push(`❌ Edge function não responde: ${error.message}`);
        recommendations.push('Verificar se a edge function está deployada');
        recommendations.push('Verificar logs da edge function');
      } else {
        findings.push('✅ Edge function responde corretamente');
      }

      return {
        success: !error,
        findings,
        recommendations,
        data: { response: data, error }
      };

    } catch (error: any) {
      return {
        success: false,
        findings: [`Erro no teste: ${error.message}`],
        recommendations: ['Verificar configuração do Supabase', 'Verificar edge functions']
      };
    }
  },

  // Recuperar pagamentos órfãos
  async recoverOrphanPayments(): Promise<PixDebugResult> {
    try {
      console.log('🔄 [PIX Debug] Recuperando pagamentos órfãos');
      
      const findings: string[] = [];
      const recommendations: string[] = [];
      let recovered = 0;

      // Buscar webhooks de pagamento sem pedidos correspondentes
      const { data: webhooks, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('origem', 'mercadopago-pix-completo')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        throw error;
      }

      for (const webhook of webhooks || []) {
        try {
          const payload = webhook.payload as any;
          const externalRef = payload?.data?.external_reference || payload?.external_reference;
          const amount = payload?.data?.transaction_amount || payload?.transaction_amount;

          if (externalRef && amount) {
            // Verificar se já existe pedido para este webhook
            const { data: existingOrder } = await supabase
              .from('pedidos')
              .select('id')
              .eq('transaction_id', externalRef)
              .single();

            if (!existingOrder) {
              findings.push(`Webhook órfão encontrado: ${webhook.id} - External Ref: ${externalRef}`);
              recommendations.push(`Investigar pagamento com referência ${externalRef}`);
              // Aqui você pode implementar lógica de recuperação automática se necessário
            }
          }
        } catch (webhookError) {
          console.error('Erro processando webhook:', webhookError);
        }
      }

      findings.push(`Processados ${webhooks?.length || 0} webhooks para análise`);
      
      return {
        success: true,
        findings,
        recommendations,
        data: { webhooksAnalyzed: webhooks?.length || 0, recovered }
      };

    } catch (error: any) {
      return {
        success: false,
        findings: [`Erro na recuperação: ${error.message}`],
        recommendations: ['Verificar logs do sistema', 'Executar diagnóstico manual']
      };
    }
  },

  // Simular pagamento para teste
  async simulatePaymentConfirmation(pedidoId: string): Promise<PixDebugResult> {
    try {
      console.log(`🧪 [PIX Debug] Simulando confirmação de pagamento para pedido: ${pedidoId}`);
      
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();

      if (pedidoError || !pedido) {
        throw new Error(`Pedido não encontrado: ${pedidoError?.message}`);
      }

      // Simular webhook de confirmação
      const { error: webhookError } = await supabase
        .from('webhook_logs')
        .insert({
          origem: 'debug-simulation',
          status: 'success',
          payload: {
            type: 'payment',
            action: 'payment.approved',
            data: {
              id: `sim_${Date.now()}`,
              status: 'approved',
              external_reference: pedido.transaction_id,
              transaction_amount: pedido.valor_total,
              simulated: true,
              debug_mode: true
            }
          }
        });

      if (webhookError) {
        throw webhookError;
      }

      // Atualizar pedido
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({
          status: 'pago_pendente_video',
          log_pagamento: {
            ...(pedido.log_pagamento || {}),
            simulated_payment: true,
            debug_confirmation: true,
            confirmed_at: new Date().toISOString()
          }
        })
        .eq('id', pedidoId);

      if (updateError) {
        throw updateError;
      }

      toast.success('Pagamento simulado com sucesso!');

      return {
        success: true,
        findings: [
          'Webhook de teste criado',
          'Pedido atualizado para pago_pendente_video',
          'Simulação concluída com sucesso'
        ],
        recommendations: [
          'Verificar se o fluxo normal funcionaria da mesma forma',
          'Testar webhook real do MercadoPago'
        ]
      };

    } catch (error: any) {
      return {
        success: false,
        findings: [`Erro na simulação: ${error.message}`],
        recommendations: ['Verificar dados do pedido', 'Tentar novamente']
      };
    }
  }
};
