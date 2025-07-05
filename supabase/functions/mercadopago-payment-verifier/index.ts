
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

    const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!MP_ACCESS_TOKEN) {
      console.error('❌ [MP_VERIFIER] Token do MercadoPago não configurado');
      return new Response(
        JSON.stringify({ success: false, error: 'MercadoPago token not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('🔍 [MP_VERIFIER] Iniciando verificação automática de pagamentos');

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
      console.error('❌ [MP_VERIFIER] Erro ao buscar pedidos:', ordersError);
      throw new Error(`Erro ao buscar pedidos pendentes: ${ordersError.message}`);
    }

    console.log(`📊 [MP_VERIFIER] Encontrados ${pendingOrders?.length || 0} pedidos pendentes para verificação`);

    let verifiedCount = 0;
    let approvedCount = 0;
    const errors: string[] = [];
    const processedPayments: any[] = [];

    for (const pedido of pendingOrders || []) {
      try {
        // Tentar extrair payment_id do log de pagamento
        const logPagamento = pedido.log_pagamento as any;
        let paymentId = null;

        // Diferentes formas de encontrar o payment_id
        if (logPagamento?.pixData?.paymentId) {
          paymentId = logPagamento.pixData.paymentId;
        } else if (logPagamento?.payment_id) {
          paymentId = logPagamento.payment_id;
        } else if (logPagamento?.mercadopago_payment_id) {
          paymentId = logPagamento.mercadopago_payment_id;
        } else if (pedido.transaction_id) {
          paymentId = pedido.transaction_id;
        }

        if (!paymentId) {
          console.log(`⚠️ [MP_VERIFIER] Pedido ${pedido.id} sem payment_id identificável`);
          continue;
        }

        console.log(`🔍 [MP_VERIFIER] Verificando pagamento ${paymentId} para pedido ${pedido.id}`);

        // Consultar API do MercadoPago
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (!mpResponse.ok) {
          console.warn(`⚠️ [MP_VERIFIER] Erro na API MP para ${paymentId}: ${mpResponse.status}`);
          continue;
        }

        const paymentData = await mpResponse.json();
        verifiedCount++;

        console.log(`📄 [MP_VERIFIER] Status do pagamento ${paymentId}: ${paymentData.status}`);

        processedPayments.push({
          pedido_id: pedido.id,
          payment_id: paymentId,
          mp_status: paymentData.status,
          amount: paymentData.transaction_amount,
          date_approved: paymentData.date_approved
        });

        // Se foi aprovado, atualizar pedido
        if (paymentData.status === 'approved') {
          const { error: updateError } = await supabase
            .from('pedidos')
            .update({
              status: 'pago_pendente_video',
              transaction_id: paymentId,
              log_pagamento: {
                ...logPagamento,
                auto_verified: true,
                payment_status: 'approved',
                auto_verified_at: new Date().toISOString(),
                mercadopago_data: paymentData,
                original_payment_data: paymentData
              }
            })
            .eq('id', pedido.id);

          if (updateError) {
            errors.push(`Erro ao atualizar pedido ${pedido.id}: ${updateError.message}`);
          } else {
            approvedCount++;
            console.log(`✅ [MP_VERIFIER] Pedido ${pedido.id} atualizado para pago_pendente_video`);

            // Log do tracking
            await supabase
              .from('payment_status_tracking')
              .insert({
                pedido_id: pedido.id,
                status_anterior: 'pendente',
                status_novo: 'pago_pendente_video',
                origem: 'mercadopago_api_verification',
                detalhes: {
                  payment_id: paymentId,
                  mercadopago_status: paymentData.status,
                  auto_verified: true,
                  verification_timestamp: new Date().toISOString(),
                  amount_verified: paymentData.transaction_amount
                }
              });
          }
        }

      } catch (orderError: any) {
        errors.push(`Erro no pedido ${pedido.id}: ${orderError.message}`);
        console.error(`❌ [MP_VERIFIER] Erro processando pedido ${pedido.id}:`, orderError);
      }
    }

    const result = {
      success: true,
      total_checked: pendingOrders?.length || 0,
      verified_count: verifiedCount,
      approved_count: approvedCount,
      errors: errors,
      processed_payments: processedPayments,
      timestamp: new Date().toISOString()
    };

    // Log do resultado
    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'MERCADOPAGO_PAYMENT_VERIFICATION',
        descricao: `Verificação MP: ${approvedCount} pagamentos confirmados de ${verifiedCount} verificados. Total checados: ${pendingOrders?.length || 0}`
      });

    console.log(`✅ [MP_VERIFIER] Verificação concluída:`, result);
    
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
    console.error('❌ [MP_VERIFIER] Erro na verificação:', error);
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
});
