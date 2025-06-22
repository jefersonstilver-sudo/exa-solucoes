
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mercado Pago credentials
const MP_ACCESS_TOKEN = "APP_USR-3153677823178280-051713-2c17681f0f1d5b06e0350601dfd860ad-124133412";
const MP_WEBHOOK_SECRET = "fd56e44c5135cea21520f535e882abcfd1000b2901f0d9d4868ddf2ade5021ed";

// Webhook signature validation
function validateWebhookSignature(rawBody: string, signature: string): boolean {
  try {
    const expectedSignature = createHmac('sha256', MP_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');
    
    // Mercado Pago pode enviar com prefixo "sha256="
    const cleanSignature = signature.replace('sha256=', '');
    
    return expectedSignature === cleanSignature;
  } catch (error) {
    console.error("❌ [WEBHOOK] Erro na validação de assinatura:", error);
    return false;
  }
}

// Consultar pagamento diretamente no Mercado Pago
async function consultarPagamentoMP(paymentId: string) {
  try {
    console.log(`🔍 [WEBHOOK] Consultando pagamento ${paymentId} no Mercado Pago`);
    
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`MP API Error: ${response.status}`);
    }

    const paymentData = await response.json();
    console.log(`✅ [WEBHOOK] Pagamento consultado:`, {
      id: paymentData.id,
      status: paymentData.status,
      amount: paymentData.transaction_amount,
      external_reference: paymentData.external_reference
    });

    return paymentData;
  } catch (error) {
    console.error(`❌ [WEBHOOK] Erro ao consultar pagamento ${paymentId}:`, error);
    return null;
  }
}

serve(async (req) => {
  // Log IMEDIATO de QUALQUER requisição recebida
  console.log("🎯 [WEBHOOK] ===== NOVA REQUISIÇÃO RECEBIDA =====");
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
    
    // Validação de assinatura (opcional, mas recomendada)
    const signature = req.headers.get('x-signature');
    if (signature && !validateWebhookSignature(bodyText, signature)) {
      console.warn("⚠️ [WEBHOOK] Assinatura inválida - processando mesmo assim");
      // Continuamos processando mesmo com assinatura inválida para não perder pagamentos
    }
    
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
        origem: 'mercadopago-webhook-v2-enhanced',
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
    let paymentId = paymentData.id?.toString();
    let amount = paymentData.transaction_amount;

    console.log("🔍 [WEBHOOK] Dados extraídos:", {
      paymentStatus,
      externalReference,
      paymentId,
      amount,
      hasPaymentData: !!paymentData
    });

    // Se não temos dados suficientes, tentar consultar diretamente no MP
    if (paymentId && (!amount || !paymentStatus)) {
      console.log("🔍 [WEBHOOK] Dados incompletos, consultando Mercado Pago...");
      const mpData = await consultarPagamentoMP(paymentId);
      if (mpData) {
        paymentData = mpData;
        paymentStatus = mpData.status;
        externalReference = mpData.external_reference;
        amount = mpData.transaction_amount;
      }
    }

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

      // BUSCA 3: Se ainda não encontrou, buscar TODOS os pedidos pendentes do valor
      if (!pedidoEncontrado && amount) {
        console.log("🔍 [WEBHOOK] Busca ampliada por valor em todos os pedidos pendentes:", amount);
        const { data: allPendingByValue, error: allError } = await supabase
          .from('pedidos')
          .select('*')
          .eq('valor_total', amount)
          .eq('status', 'pendente')
          .order('created_at', { ascending: false })
          .limit(5);

        if (!allError && allPendingByValue && allPendingByValue.length > 0) {
          pedido = allPendingByValue[0]; // Pegar o mais recente
          pedidoEncontrado = true;
          console.log("✅ [WEBHOOK] Pedido encontrado por busca ampliada:", pedido.id);
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
          webhook_v2_enhanced: true,
          webhook_timestamp: new Date().toISOString(),
          full_mp_data: paymentData
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
            origem: 'webhook_v2_enhanced',
            detalhes: {
              payment_id: paymentId,
              external_reference: externalReference,
              amount: amount,
              webhook_enhanced: true,
              found_by: externalReference ? 'transaction_id' : 'valor_tempo'
            }
          });

        console.log("✅ [WEBHOOK] Pedido atualizado com sucesso!");

        // Log de sucesso
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'WEBHOOK_PAYMENT_CONFIRMED_V2',
            descricao: `Webhook V2 ENHANCED: Pedido ${pedido.id} confirmado. Payment ID: ${paymentId}, Valor: ${amount}`
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Pagamento processado com sucesso - WEBHOOK V2 ENHANCED",
            pedido_id: pedido.id,
            payment_id: paymentId,
            version: "v2-enhanced"
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } else {
        console.warn("⚠️ [WEBHOOK] PEDIDO NÃO ENCONTRADO - Iniciando busca no Mercado Pago!");
        
        // Se não encontrou o pedido, mas temos um payment_id, vamos consultar o MP
        if (paymentId) {
          const mpPaymentData = await consultarPagamentoMP(paymentId);
          if (mpPaymentData && mpPaymentData.status === 'approved') {
            
            // Buscar novamente com os dados do MP
            const mpAmount = mpPaymentData.transaction_amount;
            const mpReference = mpPaymentData.external_reference;
            
            console.log("🔍 [WEBHOOK] Tentando encontrar pedido com dados do MP:", {
              mpAmount,
              mpReference
            });
            
            // Busca final com dados do MP
            const { data: finalSearch, error: finalError } = await supabase
              .from('pedidos')
              .select('*')
              .eq('valor_total', mpAmount)
              .eq('status', 'pendente')
              .order('created_at', { ascending: false })
              .limit(1);

            if (!finalError && finalSearch && finalSearch.length > 0) {
              const foundPedido = finalSearch[0];
              
              // Processar o pedido encontrado
              const updatedLogPagamento = {
                ...(foundPedido.log_pagamento || {}),
                payment_confirmed_at: new Date().toISOString(),
                mercadopago_payment_id: paymentId,
                external_reference: mpReference,
                payment_status: 'approved',
                webhook_processed: true,
                webhook_v2_enhanced: true,
                recovered_from_mp_api: true,
                webhook_timestamp: new Date().toISOString(),
                full_mp_data: mpPaymentData
              };

              const { error: updateError } = await supabase
                .from('pedidos')
                .update({
                  status: 'pago_pendente_video',
                  log_pagamento: updatedLogPagamento
                })
                .eq('id', foundPedido.id);

              if (!updateError) {
                console.log("🎉 [WEBHOOK] PEDIDO RECUPERADO COM SUCESSO VIA API MP!");
                
                // Log de recuperação
                await supabase
                  .from('log_eventos_sistema')
                  .insert({
                    tipo_evento: 'WEBHOOK_PAYMENT_RECOVERED_FROM_MP',
                    descricao: `Webhook V2: Pedido ${foundPedido.id} recuperado via API MP. Payment ID: ${paymentId}`
                  });

                return new Response(
                  JSON.stringify({ 
                    success: true, 
                    message: "Pagamento recuperado com sucesso via API Mercado Pago!",
                    pedido_id: foundPedido.id,
                    payment_id: paymentId,
                    recovered: true
                  }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            }
          }
        }

        // Se chegou até aqui, não conseguiu encontrar/processar
        console.warn("⚠️ [WEBHOOK] PEDIDO DEFINITIVAMENTE NÃO ENCONTRADO!");
        
        // Log para investigação
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'WEBHOOK_PEDIDO_NAO_ENCONTRADO_V2',
            descricao: `Webhook V2 ENHANCED: pedido não encontrado após todas as tentativas. payment_id=${paymentId}, external_ref=${externalReference}, amount=${amount}`
          });

        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Pedido não encontrado após busca completa",
            payment_id: paymentId,
            external_reference: externalReference,
            amount: amount,
            version: "v2-enhanced"
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
        payment_id: paymentId,
        version: "v2-enhanced"
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
        timestamp: new Date().toISOString(),
        version: "v2-enhanced"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
