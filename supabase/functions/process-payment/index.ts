// Mercado Pago Payment Processing (PIX + Checkout Pro)
// Version: 5.0.0 - Suporte para PIX e Checkout Pro
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 5 payment attempts per minute per IP
  const clientId = getClientIdentifier(req);
  const rateLimitResult = checkRateLimit(clientId, {
    maxAttempts: 5,
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000 // 5 minutes block
  });

  if (!rateLimitResult.allowed) {
    console.warn(`🚫 [PAYMENT] Rate limit exceeded for ${clientId}`);
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  try {
    const body = await req.json();
    const { pedido_id, payment_method, total_amount, create_preference } = body;
    
    console.log('🎯 [PAYMENT] Iniciando processamento:', { pedido_id, payment_method, create_preference });
    
    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (!pedido_id) {
      throw new Error('pedido_id é obrigatório');
    }

    // Buscar dados do pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedido_id)
      .single();

    if (pedidoError || !pedido) {
      console.error('❌ [PAYMENT] Pedido não encontrado:', pedidoError);
      throw new Error('Pedido não encontrado');
    }

    console.log(`✅ [PAYMENT] Pedido encontrado. Valor: R$ ${pedido.valor_total}`);

    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mpAccessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    // Se create_preference = true, criar preferência Checkout Pro (para cartão)
    if (create_preference) {
      console.log('💳 [PAYMENT] Criando preferência Checkout Pro para cartão...');
      
      const preferencePayload = {
        items: [{
          title: `Campanha Publicitária - Pedido #${pedido_id.substring(0, 8)}`,
          quantity: 1,
          unit_price: pedido.valor_total,
          currency_id: 'BRL'
        }],
        external_reference: pedido_id,
        back_urls: {
          success: `${Deno.env.get('SITE_URL')}/pedido-confirmado?id=${pedido_id}`,
          failure: `${Deno.env.get('SITE_URL')}/checkout/resumo`,
          pending: `${Deno.env.get('SITE_URL')}/pedido-confirmado?id=${pedido_id}`
        },
        auto_return: 'approved',
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }],
          installments: 12
        },
        notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`
      };

      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferencePayload)
      });

      if (!mpResponse.ok) {
        const errorData = await mpResponse.text();
        console.error('❌ [PAYMENT] Erro Mercado Pago:', errorData);
        throw new Error(`Mercado Pago API error: ${mpResponse.status}`);
      }

      const mpData = await mpResponse.json();
      console.log('✅ [PAYMENT] Preferência criada:', mpData.id);

      // Atualizar pedido com preference_id
      await supabase
        .from('pedidos')
        .update({ 
          log_pagamento: { 
            ...pedido.log_pagamento,
            preference_id: mpData.id,
            init_point: mpData.init_point,
            method: 'credit_card',
            lastUpdated: new Date().toISOString()
          }
        })
        .eq('id', pedido_id);

      return new Response(
        JSON.stringify({
          success: true,
          preference_id: mpData.id,
          init_point: mpData.init_point,
          sandbox_init_point: mpData.sandbox_init_point
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se não, criar pagamento PIX (lógica existente)
    console.log('💵 [PAYMENT] Criando pagamento PIX...');

    // Verificar se já existe pagamento PIX
    if (pedido.log_pagamento?.pixData?.paymentId) {
      console.log('⚠️ [PAYMENT] Pagamento PIX já existe');
      return new Response(
        JSON.stringify({
          success: true,
          qrCodeBase64: pedido.log_pagamento.pixData.qrCodeBase64,
          qrCode: pedido.log_pagamento.pixData.qrCode,
          paymentId: pedido.log_pagamento.pixData.paymentId,
          status: pedido.log_pagamento.pixData.status || 'pending',
          message: 'Pagamento PIX já existe'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar email do cliente
    const { data: userData } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', pedido.client_id)
      .single();

    const payerEmail = userData?.email || 'contato@indexa.com.br';

    const paymentPayload = {
      transaction_amount: pedido.valor_total,
      description: `Campanha publicitária digital - Pedido #${pedido_id.substring(0, 8)}`,
      payment_method_id: 'pix',
      payer: {
        email: payerEmail,
        first_name: 'Cliente',
        last_name: 'Indexa'
      },
      external_reference: pedido_id,
      metadata: {
        pedido_id,
        payment_method: 'pix',
        total_amount: pedido.valor_total
      }
    };

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': pedido_id
      },
      body: JSON.stringify(paymentPayload)
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      console.error('❌ [PAYMENT] Erro Mercado Pago:', errorData);
      throw new Error(`Mercado Pago API error: ${mpResponse.status}`);
    }

    const mpData = await mpResponse.json();
    console.log('✅ [PAYMENT] Pagamento PIX criado:', mpData.id);

    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || '';
    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code || '';
    const paymentId = mpData.id;

    if (!qrCodeBase64 || !qrCode) {
      throw new Error('QR Code PIX não foi gerado');
    }

    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 30);

    const pixData = {
      qrCodeBase64,
      qrCode,
      paymentId: String(paymentId),
      status: mpData.status || 'pending',
      expiresAt: expirationDate.toISOString(),
      createdAt: new Date().toISOString(),
      mpResponse: {
        id: mpData.id,
        status: mpData.status,
        status_detail: mpData.status_detail
      }
    };

    await supabase
      .from('pedidos')
      .update({ 
        log_pagamento: { 
          pixData,
          method: 'pix',
          lastUpdated: new Date().toISOString()
        }
      })
      .eq('id', pedido_id);

    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'pix_gerado',
        descricao: `QR Code PIX gerado para pedido ${pedido_id}`,
        detalhes: {
          pedido_id,
          paymentId: String(paymentId),
          valor: pedido.valor_total,
          status: mpData.status
        }
      });

    console.log('🎉 [PAYMENT] PIX criado com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        qrCodeBase64,
        qrCode,
        paymentId: String(paymentId),
        status: mpData.status || 'pending',
        expiresAt: expirationDate.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [PAYMENT] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});