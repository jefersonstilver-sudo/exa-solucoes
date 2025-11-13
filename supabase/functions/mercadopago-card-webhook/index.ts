// Mercado Pago Credit Card Webhook Handler (TESTE)
// Version: 1.0.0 - Webhook para pagamentos com cartão de teste
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
    console.log('🔔 [WEBHOOK-CARD-TEST] Webhook recebido');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    
    console.log('📦 [WEBHOOK-CARD-TEST] Payload:', JSON.stringify(payload, null, 2));

    // Log do webhook
    await supabase.from('webhook_logs').insert({
      origem: 'mercadopago-card-teste',
      payload: payload,
      status: 'received',
      recebido_em: new Date().toISOString()
    });

    // Extrair dados
    const action = payload.action;
    const paymentData = payload.data || {};
    const paymentId = paymentData.id;

    console.log(`🔍 [WEBHOOK-CARD-TEST] Action: ${action}, PaymentID: ${paymentId}`);

    // Processar apenas eventos de pagamento aprovado
    if (action !== 'payment.updated' && action !== 'payment.created' && action !== 'payment.approved') {
      console.log(`⏭️ [WEBHOOK-CARD-TEST] Evento ignorado: ${action}`);
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!paymentId) {
      console.error('❌ [WEBHOOK-CARD-TEST] PaymentID ausente');
      return new Response(JSON.stringify({ success: false, error: 'PaymentID ausente' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar informações do pagamento via API do Mercado Pago (TESTE)
    const mpAccessTokenTest = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN_TEST');
    
    if (!mpAccessTokenTest) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN_TEST não configurado');
    }

    console.log('🔍 [WEBHOOK-CARD-TEST] Buscando detalhes do pagamento no Mercado Pago...');

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${mpAccessTokenTest}`,
        'Content-Type': 'application/json'
      }
    });

    if (!mpResponse.ok) {
      throw new Error(`Erro ao buscar pagamento: ${mpResponse.statusText}`);
    }

    const payment = await mpResponse.json();
    
    console.log('💳 [WEBHOOK-CARD-TEST] Status do pagamento:', payment.status);
    console.log('📋 [WEBHOOK-CARD-TEST] External reference:', payment.external_reference);

    // Verificar se pagamento foi aprovado
    if (payment.status !== 'approved') {
      console.log(`⏭️ [WEBHOOK-CARD-TEST] Pagamento não aprovado ainda: ${payment.status}`);
      return new Response(JSON.stringify({ success: true, status: payment.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar pedido por external_reference (pedidoId)
    const pedidoId = payment.external_reference;

    if (!pedidoId) {
      throw new Error('external_reference (pedidoId) não encontrado no pagamento');
    }

    console.log(`🔍 [WEBHOOK-CARD-TEST] Buscando pedido: ${pedidoId}`);

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !pedido) {
      console.error('❌ [WEBHOOK-CARD-TEST] Pedido não encontrado:', pedidoError);
      throw new Error(`Pedido ${pedidoId} não encontrado`);
    }

    // Verificar se já foi processado (anti-duplicação)
    if (pedido.status === 'pago_pendente_video' || pedido.status === 'pago') {
      console.warn('🚫 [WEBHOOK-CARD-TEST] Pedido já foi marcado como pago anteriormente');
      
      await supabase.from('log_eventos_sistema').insert({
        tipo_evento: 'WEBHOOK_DUPLICADO_BLOQUEADO_CARD_TEST',
        descricao: `Tentativa de reprocessamento bloqueada: pedidoId=${pedidoId}, paymentId=${paymentId}`
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Pedido já processado',
        duplicate_blocked: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Atualizar pedido para pago_pendente_video
    console.log('✅ [WEBHOOK-CARD-TEST] Atualizando pedido para PAGO');

    const updatedLogPagamento = {
      ...(pedido.log_pagamento || {}),
      cardData: {
        ...(pedido.log_pagamento?.cardData || {}),
        status: 'approved',
        approvedAt: new Date().toISOString(),
        transactionAmount: payment.transaction_amount
      },
      payment_status: 'approved',
      approved_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        status: 'pago_pendente_video',
        log_pagamento: updatedLogPagamento
      })
      .eq('id', pedidoId);

    if (updateError) {
      console.error('❌ [WEBHOOK-CARD-TEST] Erro ao atualizar pedido:', updateError);
      throw updateError;
    }

    console.log('🎉 [WEBHOOK-CARD-TEST] Pedido atualizado com sucesso!');

    // Log de sucesso
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'CARTAO_APROVADO_TESTE',
      descricao: `Pagamento com cartão aprovado (TESTE): pedidoId=${pedidoId}, paymentId=${paymentId}, valor=R$${payment.transaction_amount}`
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Pagamento processado com sucesso',
      pedidoId,
      status: 'pago_pendente_video'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ [WEBHOOK-CARD-TEST] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro ao processar webhook'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
