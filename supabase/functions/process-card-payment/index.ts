// Mercado Pago Credit Card Payment Processing (TESTE)
// Version: 1.0.0 - Processamento de cartão com credenciais de teste
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { MercadoPagoConfig, Payment } from "https://esm.sh/mercadopago@2.0.15?target=deno";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 5 card payment attempts per minute per IP
  const clientId = getClientIdentifier(req);
  const rateLimitResult = checkRateLimit(clientId, {
    maxAttempts: 5,
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000 // 5 minutes block
  });

  if (!rateLimitResult.allowed) {
    console.warn(`🚫 [CARD-PAYMENT] Rate limit exceeded for ${clientId}`);
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  try {
    console.log('💳 [CARD-TEST] Iniciando process-card-payment com credenciais de TESTE');
    
    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obter dados do request
    const { pedidoId, cardData } = await req.json();
    
    if (!pedidoId) {
      throw new Error('pedidoId é obrigatório');
    }

    if (!cardData || !cardData.token) {
      throw new Error('Dados do cartão (token) são obrigatórios');
    }

    console.log(`📦 [CARD-TEST] Buscando pedido: ${pedidoId}`);

    // Buscar dados do pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !pedido) {
      console.error('❌ [CARD-TEST] Pedido não encontrado:', pedidoError);
      throw new Error('Pedido não encontrado');
    }

    console.log(`✅ [CARD-TEST] Pedido encontrado. Valor: R$ ${pedido.valor_total}`);

    // Verificar se já existe pagamento processado
    if (pedido.log_pagamento?.cardData?.paymentId) {
      console.log('⚠️ [CARD-TEST] Pagamento com cartão já foi processado');
      return new Response(
        JSON.stringify({
          success: true,
          paymentId: pedido.log_pagamento.cardData.paymentId,
          status: pedido.log_pagamento.cardData.status || 'approved',
          message: 'Pagamento com cartão já existe'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Configurar MercadoPago com credenciais de TESTE CARTÃO
    const mpAccessTokenTest = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN_TEST');
    
    if (!mpAccessTokenTest) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN_TEST (TESTE CARTÃO) não configurado');
    }

    console.log('🔑 [CARD-TEST] Credenciais de TESTE carregadas');

    const mpClient = new MercadoPagoConfig({
      accessToken: mpAccessTokenTest,
      options: { timeout: 10000 }
    });

    const payment = new Payment(mpClient);

    // Buscar email do cliente
    const { data: userData } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', pedido.client_id)
      .single();

    const payerEmail = userData?.email || 'test@test.com';

    // Criar pagamento com cartão
    console.log('💳 [CARD-TEST] Processando pagamento com cartão no Mercado Pago (TESTE)...');
    
    const paymentData = {
      transaction_amount: pedido.valor_total,
      token: cardData.token,
      description: `Campanha publicitária digital - Pedido #${pedidoId.substring(0, 8)}`,
      installments: cardData.installments || 1,
      payment_method_id: cardData.payment_method_id || 'visa',
      payer: {
        email: payerEmail,
        identification: {
          type: cardData.document_type || 'CPF',
          number: cardData.document_number || '12345678909'
        }
      },
      external_reference: pedidoId,
      metadata: {
        pedido_id: pedidoId,
        payment_method: 'credit_card',
        total_amount: pedido.valor_total
      }
    };

    const mpResponse = await payment.create({ body: paymentData });

    console.log('✅ [CARD-TEST] Resposta do Mercado Pago:', mpResponse);

    const paymentId = mpResponse.id?.toString() || '';
    const paymentStatus = mpResponse.status || 'pending';
    const statusDetail = mpResponse.status_detail || '';

    // Salvar dados no pedido
    const cardPaymentData = {
      paymentId,
      status: paymentStatus,
      statusDetail,
      cardBrand: mpResponse.payment_method_id || 'unknown',
      lastFourDigits: mpResponse.card?.last_four_digits || '****',
      installments: cardData.installments || 1,
      transactionAmount: pedido.valor_total,
      createdAt: new Date().toISOString()
    };

    const updatedLogPagamento = {
      ...(pedido.log_pagamento || {}),
      cardData: cardPaymentData,
      payment_method: 'credit_card',
      payment_id: paymentId,
      payment_status: paymentStatus
    };

    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        log_pagamento: updatedLogPagamento,
        transaction_id: pedidoId,
        status: paymentStatus === 'approved' ? 'pago_pendente_video' : 'pendente'
      })
      .eq('id', pedidoId);

    if (updateError) {
      console.error('❌ [CARD-TEST] Erro ao salvar dados do pagamento:', updateError);
      throw updateError;
    }

    console.log('✅ [CARD-TEST] Dados do pagamento salvos com sucesso');

    // Log de evento
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: paymentStatus === 'approved' ? 'CARTAO_APROVADO_TESTE' : 'CARTAO_PROCESSADO_TESTE',
      descricao: `Pagamento com cartão ${paymentStatus} (TESTE): pedido=${pedidoId}, paymentId=${paymentId}, valor=R$${pedido.valor_total}`
    });

    return new Response(
      JSON.stringify({
        success: true,
        paymentId,
        status: paymentStatus,
        statusDetail,
        approved: paymentStatus === 'approved'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [CARD-TEST] Erro:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao processar pagamento com cartão'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
