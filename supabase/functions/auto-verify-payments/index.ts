
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function handleCorsPreflightRequest() {
  return new Response(null, { headers: corsHeaders });
}

function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(supabaseUrl, supabaseKey);
}

async function autoVerifyPendingPayments(supabase: any) {
  try {
    console.log('🔄 [AUTO_VERIFY] Iniciando verificação automática de pagamentos');

    // Buscar pedidos pendentes há mais de 10 minutos
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    const { data: pendingOrders, error: ordersError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('status', 'pendente')
      .lt('created_at', tenMinutesAgo.toISOString())
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Últimas 24h apenas

    if (ordersError) {
      throw new Error(`Erro ao buscar pedidos pendentes: ${ordersError.message}`);
    }

    console.log(`📊 [AUTO_VERIFY] Encontrados ${pendingOrders?.length || 0} pedidos pendentes para verificação`);

    let verifiedCount = 0;
    let approvedCount = 0;
    const errors: string[] = [];

    for (const pedido of pendingOrders || []) {
      try {
        // Verificar se tem log de pagamento com payment ID
        const logPagamento = pedido.log_pagamento as any;
        if (!logPagamento?.pixData?.paymentId) {
          continue;
        }

        const paymentId = logPagamento.pixData.paymentId;
        console.log(`🔍 [AUTO_VERIFY] Verificando pagamento ${paymentId} para pedido ${pedido.id}`);

        // Consultar API do Mercado Pago
        const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
        if (!MP_ACCESS_TOKEN) {
          throw new Error('Token do Mercado Pago não configurado');
        }

        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (!mpResponse.ok) {
          console.warn(`⚠️ [AUTO_VERIFY] Erro na API MP para ${paymentId}: ${mpResponse.status}`);
          continue;
        }

        const paymentData = await mpResponse.json();
        verifiedCount++;

        console.log(`📄 [AUTO_VERIFY] Status do pagamento ${paymentId}: ${paymentData.status}`);

        // Se foi aprovado, atualizar pedido
        if (paymentData.status === 'approved') {
          const { error: updateError } = await supabase
            .from('pedidos')
            .update({
              status: 'pago_pendente_video',
              log_pagamento: {
                ...logPagamento,
                auto_verified: true,
                payment_status: 'approved',
                auto_verified_at: new Date().toISOString(),
                mercadopago_data: paymentData
              }
            })
            .eq('id', pedido.id);

          if (updateError) {
            errors.push(`Erro ao atualizar pedido ${pedido.id}: ${updateError.message}`);
          } else {
            approvedCount++;
            console.log(`✅ [AUTO_VERIFY] Pedido ${pedido.id} atualizado para pago_pendente_video`);

            // Log do evento
            await supabase
              .from('payment_status_tracking')
              .insert({
                pedido_id: pedido.id,
                status_anterior: 'pendente',
                status_novo: 'pago_pendente_video',
                origem: 'auto_verification',
                detalhes: {
                  payment_id: paymentId,
                  mercadopago_status: paymentData.status,
                  auto_verified: true,
                  verification_timestamp: new Date().toISOString()
                }
              });
          }
        }

      } catch (orderError: any) {
        errors.push(`Erro no pedido ${pedido.id}: ${orderError.message}`);
        console.error(`❌ [AUTO_VERIFY] Erro processando pedido ${pedido.id}:`, orderError);
      }
    }

    const result = {
      success: true,
      total_checked: pendingOrders?.length || 0,
      verified_count: verifiedCount,
      approved_count: approvedCount,
      errors: errors,
      timestamp: new Date().toISOString()
    };

    // Log do resultado
    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'AUTO_PAYMENT_VERIFICATION',
        descricao: `Verificação automática: ${approvedCount} pagamentos confirmados de ${verifiedCount} verificados`
      });

    console.log(`✅ [AUTO_VERIFY] Verificação concluída:`, result);
    return result;

  } catch (error: any) {
    console.error('❌ [AUTO_VERIFY] Erro na verificação automática:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function handleRequest(req: Request) {
  try {
    const supabase = createSupabaseClient();
    const result = await autoVerifyPendingPayments(supabase);

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('[AUTO_VERIFY] Erro geral:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }
  
  return handleRequest(req);
});
