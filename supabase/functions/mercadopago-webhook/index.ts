// Mercado Pago PIX Webhook Handler (PRODUÇÃO)
// Version: 3.0.0 - Webhook para pagamentos PIX de produção
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 100 webhook notifications per minute per IP (webhooks can be frequent)
  const clientId = getClientIdentifier(req);
  const rateLimitResult = checkRateLimit(clientId, {
    maxAttempts: 100,
    windowMs: 60000, // 1 minute
    blockDurationMs: 600000 // 10 minutes block
  });

  if (!rateLimitResult.allowed) {
    console.warn(`🚫 [WEBHOOK-PIX-PROD] Rate limit exceeded for ${clientId}`);
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  try {
    console.log('🔔 [WEBHOOK-PIX-PROD] Webhook recebido');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    
    console.log('📦 [WEBHOOK-PIX-PROD] Payload:', JSON.stringify(payload, null, 2));

    // Log do webhook
    await supabase.from('webhook_logs').insert({
      origem: 'mercadopago-pix-producao',
      payload: payload,
      status: 'received',
      recebido_em: new Date().toISOString()
    });

    // Extrair dados
    const action = payload.action;
    const paymentData = payload.data || {};
    const paymentId = paymentData.id;

    console.log(`🔍 [WEBHOOK-PIX-PROD] Action: ${action}, PaymentID: ${paymentId}`);

    // Processar apenas eventos de pagamento aprovado
    if (action !== 'payment.updated' && action !== 'payment.created' && action !== 'payment.approved') {
      console.log(`⏭️ [WEBHOOK-PIX-PROD] Evento ignorado: ${action}`);
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!paymentId) {
      console.error('❌ [WEBHOOK-PIX-PROD] PaymentID ausente');
      return new Response(JSON.stringify({ success: false, error: 'PaymentID ausente' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar informações do pagamento via API do Mercado Pago
    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!mpAccessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    console.log('🔍 [WEBHOOK-PIX-PROD] Buscando detalhes do pagamento no Mercado Pago...');

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!mpResponse.ok) {
      throw new Error(`Erro ao buscar pagamento: ${mpResponse.statusText}`);
    }

    const payment = await mpResponse.json();
    
    console.log('💳 [WEBHOOK-PIX-PROD] Status do pagamento:', payment.status);
    console.log('📋 [WEBHOOK-PIX-PROD] External reference:', payment.external_reference);

    // Verificar se pagamento foi aprovado
    if (payment.status !== 'approved') {
      console.log(`⏭️ [WEBHOOK-PIX-PROD] Pagamento não aprovado ainda: ${payment.status}`);
      return new Response(JSON.stringify({ success: true, status: payment.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar pedido por external_reference (pedidoId)
    const pedidoId = payment.external_reference;

    if (!pedidoId) {
      throw new Error('external_reference (pedidoId) não encontrado no pagamento');
    }

    console.log(`🔍 [WEBHOOK-PIX-PROD] Buscando pedido: ${pedidoId}`);

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !pedido) {
      console.error('❌ [WEBHOOK-PIX-PROD] Pedido não encontrado:', pedidoError);
      throw new Error(`Pedido ${pedidoId} não encontrado`);
    }

    // Verificar se já foi processado (anti-duplicação)
    if (pedido.status === 'pago_pendente_video' || pedido.status === 'pago') {
      console.warn('🚫 [WEBHOOK-PIX-PROD] Pedido já foi marcado como pago anteriormente');
      
      await supabase.from('log_eventos_sistema').insert({
        tipo_evento: 'WEBHOOK_DUPLICADO_BLOQUEADO_PIX_PROD',
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
    console.log('✅ [WEBHOOK-PIX-PROD] Atualizando pedido para PAGO');

    const updatedLogPagamento = {
      ...(pedido.log_pagamento || {}),
      pixData: {
        ...(pedido.log_pagamento?.pixData || {}),
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
      console.error('❌ [WEBHOOK-PIX-PROD] Erro ao atualizar pedido:', updateError);
      throw updateError;
    }

    console.log('🎉 [WEBHOOK-PIX-PROD] Pedido atualizado com sucesso!');

    // Log de sucesso
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'PIX_APROVADO_PRODUCAO',
      descricao: `Pagamento PIX aprovado (PRODUÇÃO): pedidoId=${pedidoId}, paymentId=${paymentId}, valor=R$${payment.transaction_amount}`
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
    console.error('❌ [WEBHOOK-PIX-PROD] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro ao processar webhook'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
