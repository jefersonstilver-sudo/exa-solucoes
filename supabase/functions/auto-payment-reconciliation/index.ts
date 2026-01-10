
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

    console.log("🔄 [AUTO_RECONCILIATION] Iniciando reconciliação automática");

    // Buscar pedidos pendentes há mais de 15 minutos
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    const { data: pedidosPendentes, error: pedidosError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('status', 'pendente')
      .lt('created_at', fifteenMinutesAgo.toISOString());

    if (pedidosError) {
      console.error("❌ [AUTO_RECONCILIATION] Erro ao buscar pedidos:", pedidosError);
      throw pedidosError;
    }

    console.log(`📊 [AUTO_RECONCILIATION] Encontrados ${pedidosPendentes?.length || 0} pedidos suspeitos`);

    let processedCount = 0;
    let errors: string[] = [];

    // Processar cada pedido pendente
    for (const pedido of pedidosPendentes || []) {
      try {
        console.log(`🔍 [AUTO_RECONCILIATION] Verificando pedido ${pedido.id}`);

        // Verificar se existe webhook ASAAS relacionado (não Mercado Pago)
        const { data: webhooks, error: webhookError } = await supabase
          .from('webhook_logs')
          .select('*')
          .eq('provider', 'asaas')
          .eq('status', 'processed')
          .gte('created_at', pedido.created_at)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!webhookError && webhooks && webhooks.length > 0) {
          // Procurar webhook com valor correspondente
          const matchingWebhook = webhooks.find(webhook => {
            const payload = webhook.payload as any;
            const webhookAmount = payload?.transaction_amount || payload?.data?.transaction_amount;
            return webhookAmount && Math.abs(webhookAmount - pedido.valor_total) < 0.01;
          });

          if (matchingWebhook) {
            console.log(`✅ [AUTO_RECONCILIATION] Webhook encontrado para pedido ${pedido.id}`);
            
            // Atualizar pedido para pago
            const { error: updateError } = await supabase
              .from('pedidos')
              .update({
                status: 'pago_pendente_video',
                log_pagamento: {
                  ...pedido.log_pagamento,
                  payment_method: 'pix',
                  payment_status: 'approved',
                  auto_reconciled: true,
                  reconciled_at: new Date().toISOString(),
                  webhook_id: matchingWebhook.id
                }
              })
              .eq('id', pedido.id);

            if (updateError) {
              errors.push(`Erro ao atualizar pedido ${pedido.id}: ${updateError.message}`);
              continue;
            }

            // Registrar tracking
            await supabase
              .from('payment_status_tracking')
              .insert({
                pedido_id: pedido.id,
                status_anterior: 'pendente',
                status_novo: 'pago_pendente_video',
                origem: 'auto_reconciliation',
                detalhes: {
                  webhook_id: matchingWebhook.id,
                  reconciled_automatically: true,
                  valor_total: pedido.valor_total
                }
              });

            processedCount++;
          }
        }

      } catch (error: any) {
        errors.push(`Erro no pedido ${pedido.id}: ${error.message}`);
      }
    }

    // Log do resultado
    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'AUTO_PAYMENT_RECONCILIATION',
        descricao: `Reconciliação automática: ${processedCount} pedidos processados, ${errors.length} erros`
      });

    console.log(`✅ [AUTO_RECONCILIATION] Processamento concluído: ${processedCount} pedidos atualizados`);

    return new Response(
      JSON.stringify({
        success: true,
        processed_orders: processedCount,
        total_pending: pedidosPendentes?.length || 0,
        errors: errors,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("❌ [AUTO_RECONCILIATION] Erro na reconciliação:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
