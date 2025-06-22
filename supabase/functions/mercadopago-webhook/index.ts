
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Log IMEDIATO de QUALQUER requisição recebida
  console.log("🎯 [WEBHOOK] ===== REQUISIÇÃO RECEBIDA =====");
  console.log("🎯 [WEBHOOK] Timestamp:", new Date().toISOString());
  console.log("🎯 [WEBHOOK] Method:", req.method);
  console.log("🎯 [WEBHOOK] URL:", req.url);
  console.log("🎯 [WEBHOOK] Headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));

  if (req.method === 'OPTIONS') {
    console.log("🎯 [WEBHOOK] Respondendo CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Log do body completo
    const bodyText = await req.text();
    console.log("🎯 [WEBHOOK] Body Raw:", bodyText);
    
    let payload;
    try {
      payload = JSON.parse(bodyText);
      console.log("🎯 [WEBHOOK] Payload Parsed:", JSON.stringify(payload, null, 2));
    } catch (parseError) {
      console.error("❌ [WEBHOOK] Erro ao fazer parse do JSON:", parseError);
      throw new Error("Payload inválido");
    }

    // Log FORÇADO no banco
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        origem: 'mercadopago-webhook-fixed',
        payload: payload,
        status: 'received',
        recebido_em: new Date().toISOString()
      });

    if (logError) {
      console.error("❌ [WEBHOOK] ERRO AO SALVAR LOG:", logError);
    } else {
      console.log("✅ [WEBHOOK] Log salvo com sucesso");
    }

    // Extrair dados do pagamento com múltiplos formatos
    let paymentData = payload.data || payload;
    let paymentStatus = payload.action || payload.type || paymentData.status;
    let externalReference = paymentData.external_reference;
    let paymentId = paymentData.id;
    let amount = paymentData.transaction_amount;

    console.log("🔍 [WEBHOOK] Dados extraídos:", {
      paymentStatus,
      externalReference,
      paymentId,
      amount,
      hasPaymentData: !!paymentData
    });

    // Processar pagamento aprovado
    if (paymentStatus === 'payment.approved' || paymentStatus === 'approved' || paymentData.status === 'approved') {
      console.log("✅ [WEBHOOK] PAGAMENTO APROVADO DETECTADO!");

      let pedidoEncontrado = false;
      let pedido = null;

      // BUSCA 1: Por external_reference (transaction_id)
      if (externalReference) {
        console.log("🔍 [WEBHOOK] Buscando por transaction_id:", externalReference);
        const { data: pedidosByRef, error: refError } = await supabase
          .from('pedidos')
          .select('*')
          .eq('transaction_id', externalReference)
          .eq('status', 'pendente')
          .limit(1);

        if (!refError && pedidosByRef && pedidosByRef.length > 0) {
          pedido = pedidosByRef[0];
          pedidoEncontrado = true;
          console.log("✅ [WEBHOOK] Pedido encontrado por transaction_id:", pedido.id);
        }
      }

      // BUSCA 2: Por valor e tempo (últimas 2 horas)
      if (!pedidoEncontrado && amount) {
        console.log("🔍 [WEBHOOK] Buscando por valor e tempo:", amount);
        const { data: pedidosByValue, error: valueError } = await supabase
          .from('pedidos')
          .select('*')
          .eq('valor_total', amount)
          .eq('status', 'pendente')
          .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        if (!valueError && pedidosByValue && pedidosByValue.length > 0) {
          pedido = pedidosByValue[0];
          pedidoEncontrado = true;
          console.log("✅ [WEBHOOK] Pedido encontrado por valor:", pedido.id);
        }
      }

      if (pedidoEncontrado && pedido) {
        console.log("🎯 [WEBHOOK] Processando pedido:", {
          id: pedido.id,
          valor: pedido.valor_total,
          status_atual: pedido.status
        });

        // Atualizar pedido para pago
        const updatedLogPagamento = {
          ...(pedido.log_pagamento || {}),
          payment_confirmed_at: new Date().toISOString(),
          mercadopago_payment_id: paymentId,
          external_reference: externalReference,
          payment_status: 'approved',
          webhook_processed: true,
          webhook_fixed_version: true,
          webhook_timestamp: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('pedidos')
          .update({
            status: 'pago_pendente_video',
            log_pagamento: updatedLogPagamento
          })
          .eq('id', pedido.id);

        if (updateError) {
          console.error("❌ [WEBHOOK] Erro ao atualizar pedido:", updateError);
          throw updateError;
        }

        // Tracking do status
        await supabase
          .from('payment_status_tracking')
          .insert({
            pedido_id: pedido.id,
            status_anterior: pedido.status,
            status_novo: 'pago_pendente_video',
            origem: 'webhook_fixed',
            detalhes: {
              payment_id: paymentId,
              external_reference: externalReference,
              amount: amount,
              webhook_fixed: true,
              encontrado_por: externalReference ? 'transaction_id' : 'valor_tempo'
            }
          });

        console.log("✅ [WEBHOOK] Pedido atualizado com sucesso!");

        // Log de sucesso
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'WEBHOOK_PAYMENT_CONFIRMED',
            descricao: `Webhook CORRIGIDO: Pedido ${pedido.id} confirmado. Payment ID: ${paymentId}, Valor: ${amount}`
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Pagamento processado com sucesso - WEBHOOK CORRIGIDO",
            pedido_id: pedido.id,
            payment_id: paymentId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } else {
        console.warn("⚠️ [WEBHOOK] PEDIDO NÃO ENCONTRADO!");
        console.warn("⚠️ [WEBHOOK] Dados de busca:", {
          externalReference,
          amount,
          paymentId
        });

        // Log para investigação
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'WEBHOOK_PEDIDO_NAO_ENCONTRADO',
            descricao: `Webhook CORRIGIDO mas pedido não encontrado: payment_id=${paymentId}, external_ref=${externalReference}, amount=${amount}`
          });

        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Pedido não encontrado - será investigado",
            payment_id: paymentId,
            external_reference: externalReference,
            amount: amount
          }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Para outros tipos de webhook
    console.log("ℹ️ [WEBHOOK] Webhook recebido mas não é pagamento aprovado:", paymentStatus);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Webhook recebido - não é pagamento aprovado",
        action: paymentStatus,
        payment_id: paymentId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("❌ [WEBHOOK] ERRO CRÍTICO:", error);
    console.error("❌ [WEBHOOK] Stack:", error.stack);
    
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
