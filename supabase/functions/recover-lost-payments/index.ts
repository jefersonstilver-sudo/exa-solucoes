
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

async function recoverLostPayments(supabase: any) {
  try {
    console.log('🚨 [RECOVERY] Iniciando recuperação de pagamentos perdidos');

    const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!MP_ACCESS_TOKEN) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    // Buscar pedidos pendentes de hoje
    const hoje = new Date().toISOString().split('T')[0];
    const { data: pedidosPendentes, error: pedidosError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('status', 'pendente')
      .gte('created_at', hoje + 'T00:00:00.000Z')
      .lt('created_at', hoje + 'T23:59:59.999Z');

    if (pedidosError) {
      throw new Error(`Erro ao buscar pedidos: ${pedidosError.message}`);
    }

    console.log(`📊 [RECOVERY] Encontrados ${pedidosPendentes?.length || 0} pedidos pendentes de hoje`);

    let recuperados = 0;
    const resultados = [];

    for (const pedido of pedidosPendentes || []) {
      try {
        console.log(`🔍 [RECOVERY] Verificando pedido ${pedido.id}, valor: ${pedido.valor_total}`);

        // Buscar pagamentos no MP por valor e data
        const searchResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/search?range=today&external_reference=${pedido.transaction_id || ''}&sort=date_created&criteria=desc&limit=50`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!searchResponse.ok) {
          console.warn(`⚠️ [RECOVERY] Erro na busca MP para pedido ${pedido.id}: ${searchResponse.status}`);
          continue;
        }

        const searchData = await searchResponse.json();
        console.log(`📄 [RECOVERY] Busca MP retornou ${searchData.results?.length || 0} resultados`);

        // Procurar pagamento correspondente
        const pagamentoEncontrado = searchData.results?.find((payment: any) => {
          const valorMatch = Math.abs(payment.transaction_amount - pedido.valor_total) < 0.01;
          const statusMatch = payment.status === 'approved';
          return valorMatch && statusMatch;
        });

        if (pagamentoEncontrado) {
          console.log(`✅ [RECOVERY] Pagamento encontrado! ID: ${pagamentoEncontrado.id}`);

          // Atualizar pedido
          const { error: updateError } = await supabase
            .from('pedidos')
            .update({
              status: 'pago_pendente_video',
              log_pagamento: {
                ...(pedido.log_pagamento || {}),
                payment_recovered: true,
                recovery_timestamp: new Date().toISOString(),
                mercadopago_payment_id: pagamentoEncontrado.id,
                payment_status: 'approved',
                recovered_payment_data: pagamentoEncontrado
              }
            })
            .eq('id', pedido.id);

          if (updateError) {
            console.error(`❌ [RECOVERY] Erro ao atualizar pedido ${pedido.id}:`, updateError);
          } else {
            recuperados++;
            
            // Log do evento
            await supabase
              .from('payment_status_tracking')
              .insert({
                pedido_id: pedido.id,
                status_anterior: 'pendente',
                status_novo: 'pago_pendente_video',
                origem: 'payment_recovery',
                detalhes: {
                  payment_id: pagamentoEncontrado.id,
                  recovery_method: 'search_api',
                  original_amount: pedido.valor_total,
                  found_amount: pagamentoEncontrado.transaction_amount
                }
              });

            resultados.push({
              pedido_id: pedido.id,
              payment_id: pagamentoEncontrado.id,
              valor: pedido.valor_total,
              status: 'recuperado'
            });

            console.log(`✅ [RECOVERY] Pedido ${pedido.id} recuperado com sucesso!`);
          }
        } else {
          console.log(`❌ [RECOVERY] Nenhum pagamento encontrado para pedido ${pedido.id}`);
          resultados.push({
            pedido_id: pedido.id,
            valor: pedido.valor_total,
            status: 'nao_encontrado'
          });
        }

      } catch (pedidoError: any) {
        console.error(`❌ [RECOVERY] Erro processando pedido ${pedido.id}:`, pedidoError);
        resultados.push({
          pedido_id: pedido.id,
          valor: pedido.valor_total,
          status: 'erro',
          erro: pedidoError.message
        });
      }
    }

    const resultado = {
      success: true,
      total_verificados: pedidosPendentes?.length || 0,
      total_recuperados: recuperados,
      detalhes: resultados,
      timestamp: new Date().toISOString()
    };

    // Log do resultado
    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'PAYMENT_RECOVERY_COMPLETED',
        descricao: `Recovery concluído: ${recuperados} pagamentos recuperados de ${pedidosPendentes?.length || 0} verificados`
      });

    console.log(`✅ [RECOVERY] Recovery concluído:`, resultado);
    return resultado;

  } catch (error: any) {
    console.error('❌ [RECOVERY] Erro no recovery:', error);
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
    const result = await recoverLostPayments(supabase);

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
    console.error('[RECOVERY] Erro geral:', error);
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
