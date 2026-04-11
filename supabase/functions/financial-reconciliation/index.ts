/**
 * Edge Function: financial-reconciliation
 * Reconciliação financeira automática e manual com ASAAS
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action } = await req.json();
    console.log(`🔄 [RECONCILIATION] Action: ${action}`);

    if (action === 'automatic') {
      // Reconciliação automática: buscar webhooks ASAAS não processados
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      const { data: pedidosPendentes } = await supabase
        .from('pedidos')
        .select('*')
        .eq('status', 'pendente')
        .lt('created_at', fifteenMinutesAgo.toISOString());

      let processedCount = 0;

      for (const pedido of pedidosPendentes || []) {
        // Buscar webhooks ASAAS (não Mercado Pago)
        const { data: webhooks } = await supabase
          .from('webhook_logs')
          .select('*')
          .eq('provider', 'asaas')
          .eq('status', 'processed')
          .gte('created_at', pedido.created_at)
          .order('created_at', { ascending: false })
          .limit(5);

        const matchingWebhook = webhooks?.find(w => {
          const payload = w.payload as any;
          const webhookAmount = payload?.payment?.value;
          return webhookAmount && Math.abs(webhookAmount - pedido.valor_total) < 0.01;
        });

        if (matchingWebhook) {
          await supabase.from('pedidos').update({
            status: 'pago',
            log_pagamento: {
              ...pedido.log_pagamento,
              auto_reconciled: true,
              reconciled_at: new Date().toISOString(),
              webhook_id: matchingWebhook.id
            }
          }).eq('id', pedido.id);

          // Registrar log financeiro
          await supabase.rpc('registrar_log_financeiro', {
            p_evento_tipo: 'reconciliacao_automatica',
            p_origem: 'reconciliacao',
            p_entidade_tipo: 'pedido',
            p_entidade_id: pedido.id,
            p_descricao: `Reconciliação automática: R$ ${pedido.valor_total}`,
            p_valor_depois: pedido.valor_total,
            p_referencia_externa: matchingWebhook.webhook_id
          });

          processedCount++;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        action: 'automatic',
        processed: processedCount,
        timestamp: new Date().toISOString()
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'pending') {
      // Listar itens pendentes de reconciliação
      const { data: pending } = await supabase
        .from('parcelas')
        .select('*, pedidos(*)')
        .in('status', ['pendente', 'aguardando_pagamento'])
        .order('data_vencimento', { ascending: true })
        .limit(50);

      return new Response(JSON.stringify({
        success: true,
        pending: pending || [],
        timestamp: new Date().toISOString()
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Action not supported'
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("❌ [RECONCILIATION] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
