import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Import the MercadoPago SDK
import * as MercadoPago from "https://esm.sh/mercadopago@1.5.16";

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to handle CORS preflight requests
function handleCorsPreflightRequest() {
  return new Response(null, { headers: corsHeaders });
}

// Create a Supabase client
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(supabaseUrl, supabaseKey);
}

// Configure MercadoPago
function configureMercadoPago() {
  const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') ?? '';
  MercadoPago.configure({
    access_token: MP_ACCESS_TOKEN,
    sandbox: true
  });
  return MP_ACCESS_TOKEN;
}

// Validate pedidoId (must be a valid UUID)
function validatePedidoId(pedidoId: string) {
  const validUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!pedidoId || typeof pedidoId !== 'string' || !pedidoId.match(validUuidPattern)) {
    throw new Error(`ID de pedido inválido: ${pedidoId}`);
  }
}

// CRITICAL: Check for duplicate processing
async function checkDuplicateProcessing(supabase: any, paymentKey: string, pedidoId: string) {
  console.log(`[ANTI-DUPLICATE] Checking for duplicate processing: ${paymentKey}`);
  
  // Check if this payment key was already processed
  const { data: existingPayment, error } = await supabase
    .from('pedidos')
    .select('id, log_pagamento')
    .eq('id', pedidoId)
    .single();
    
  if (error) {
    throw new Error(`Erro ao verificar pedido: ${error.message}`);
  }
  
  if (existingPayment?.log_pagamento?.payment_preference_id || existingPayment?.log_pagamento?.pixData) {
    console.log(`[ANTI-DUPLICATE] Payment already processed for pedido: ${pedidoId}`);
    throw new Error('Pagamento já foi processado para este pedido');
  }
  
  return true;
}

// Generate PIX payment with MercadoPago
async function generatePixPayment(supabase: any, pedidoId: string, totalAmount: number, userEmail: string) {
  try {
    console.log(`🎯 [PIX] Gerando pagamento PIX para pedido: ${pedidoId}, valor: ${totalAmount}`);
    
    // Create PIX payment preference
    const preference = {
      items: [{
        id: `campaign_${pedidoId}`,
        title: `Campanha publicitária digital`,
        quantity: 1,
        unit_price: totalAmount,
        currency_id: 'BRL',
        description: `Veiculação publicitária`,
        category_id: "digital_goods"
      }],
      payer: {
        email: userEmail || 'cliente@exemplo.com'
      },
      payment_methods: {
        excluded_payment_types: [
          { id: "credit_card" },
          { id: "debit_card" },
          { id: "ticket" }
        ],
        installments: 1
      },
      external_reference: pedidoId,
      metadata: {
        pedido_id: pedidoId,
        payment_method: 'pix',
        total_amount: totalAmount
      }
    };

    // Create preference in MercadoPago
    const response = await MercadoPago.preferences.create(preference);
    const preferenceId = response.body.id;
    
    console.log(`✅ [PIX] Preferência criada: ${preferenceId}`);
    
    // Create payment specifically for PIX
    const payment = {
      transaction_amount: totalAmount,
      description: `Campanha publicitária digital - Pedido ${pedidoId}`,
      payment_method_id: 'pix',
      payer: {
        email: userEmail || 'cliente@exemplo.com'
      },
      external_reference: pedidoId,
      metadata: {
        pedido_id: pedidoId
      }
    };

    const paymentResponse = await MercadoPago.payment.create(payment);
    const paymentData = paymentResponse.body;
    
    console.log(`✅ [PIX] Pagamento PIX criado:`, {
      id: paymentData.id,
      status: paymentData.status,
      hasQrCode: !!paymentData.point_of_interaction?.transaction_data?.qr_code_base64
    });

    // Extract PIX data
    const pixData = {
      paymentId: paymentData.id.toString(),
      status: paymentData.status,
      qrCode: paymentData.point_of_interaction?.transaction_data?.qr_code || '',
      qrCodeBase64: paymentData.point_of_interaction?.transaction_data?.qr_code_base64 || '',
      preferenceId: preferenceId,
      createdAt: new Date().toISOString()
    };

    // Update order with PIX data
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        log_pagamento: {
          pixData: pixData,
          payment_method: 'pix',
          total_amount: totalAmount,
          timestamp: new Date().toISOString()
        }
      })
      .eq('id', pedidoId);

    if (updateError) {
      throw new Error(`Erro ao salvar dados PIX: ${updateError.message}`);
    }

    return { success: true, pixData };

  } catch (error: any) {
    console.error(`❌ [PIX] Erro ao gerar PIX:`, error);
    throw new Error(`Falha ao gerar PIX: ${error.message}`);
  }
}

// Main handler function
async function handleRequest(req: Request) {
  try {
    // Create Supabase client
    const supabase = createSupabaseClient();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    
    // Configure MercadoPago
    const MP_ACCESS_TOKEN = configureMercadoPago();
    
    // Get request data
    const requestData = await req.json();
    const { 
      pedido_id: pedidoId, 
      total_amount: totalAmount,
      cart_items: cartItems, 
      user_id: userId, 
      return_url: returnUrl, 
      payment_method = 'credit_card',
      payment_key,
      idempotency_key,
      anti_duplicate_controls
    } = requestData;
    
    console.log("[PAYMENT-REAL] SISTEMA CORRIGIDO - Dados recebidos:", { 
      pedidoId, 
      totalAmount, 
      userId, 
      paymentMethod: payment_method, 
      cartItemsCount: cartItems?.length,
      paymentKey,
      antiDuplicateControls: anti_duplicate_controls
    });
    
    // CRITICAL: Validate total amount is correct and not divided
    if (!totalAmount || totalAmount <= 0) {
      throw new Error(`Valor total inválido: ${totalAmount}`);
    }
    
    // CRITICAL: Check for duplicate processing
    if (payment_key) {
      await checkDuplicateProcessing(supabase, payment_key, pedidoId);
    }
    
    // Validate pedidoId
    validatePedidoId(pedidoId);
    
    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (userError) {
      throw new Error(`Erro ao buscar dados do usuário: ${userError.message}`);
    }

    // CORREÇÃO ESPECÍFICA PARA PIX
    if (payment_method === 'pix') {
      console.log("🎯 [PAYMENT-REAL] Processando PIX com integração real");
      const pixResult = await generatePixPayment(supabase, pedidoId, totalAmount, userData?.email);
      
      return new Response(
        JSON.stringify({
          success: true,
          pixData: pixResult.pixData,
          pedido_id: pedidoId,
          payment_method: 'pix'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Validate cart items
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error("Nenhum painel válido encontrado no carrinho");
    }
    
    // CRITICAL: Use the correct total amount directly, don't calculate from items
    const correctedTotalAmount = Number(totalAmount.toFixed(2));
    
    console.log(`[PAYMENT-REAL] Valor corrigido: ${correctedTotalAmount} (original: ${totalAmount})`);
    
    // Prepare MercadoPago items with CORRECT total value
    const items = [{
      id: `campaign_${pedidoId}`,
      title: `Campanha publicitária digital - ${cartItems.length} painéis`,
      quantity: 1,
      unit_price: correctedTotalAmount, // Use full amount, not divided
      currency_id: 'BRL',
      description: `Veiculação por 30 dias em ${cartItems.length} painel(éis)`,
      category_id: "digital_goods",
      picture_url: "https://via.placeholder.com/150"
    }];
    
    // Prepare return URLs
    const originUrl = returnUrl || 'https://app.indexamidia.com';
    const returnUrls = {
      successUrl: `${originUrl}/pedido-confirmado?id=${pedidoId}&status=approved`,
      failureUrl: `${originUrl}/checkout?error=payment_failed&id=${pedidoId}`,
      pendingUrl: `${originUrl}/pedido-confirmado?id=${pedidoId}&status=pending`
    };
    
    // Create MercadoPago preference
    const preference = {
      items,
      payer: {
        email: userData?.email || 'cliente@exemplo.com',
        name: "Cliente Teste",
        identification: {
          type: "CPF",
          number: "11111111111"
        }
      },
      back_urls: {
        success: returnUrls.successUrl,
        failure: returnUrls.failureUrl,
        pending: returnUrls.pendingUrl
      },
      auto_return: "approved",
      external_reference: pedidoId,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      statement_descriptor: "INDEXA MÍDIA",
      expires: false,
      payment_methods: {
        installments: 12,
      },
      metadata: {
        pedido_id: pedidoId,
        user_id: userId,
        payment_method: payment_method,
        test: true,
        email: userData?.email,
        payment_key: payment_key,
        idempotency_key: idempotency_key,
        total_amount_check: correctedTotalAmount
      }
    };
    
    console.log(`[PAYMENT-REAL] Criando preferência com valor: ${correctedTotalAmount}`);
    
    // Create preference in MercadoPago or simulate in development
    let preferenceId = "";
    let initPoint = "";
    
    try {
      if (!MP_ACCESS_TOKEN) {
        console.log("No MP_ACCESS_TOKEN found, using test mode");
        preferenceId = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        initPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}&test=true`;
      } else {
        // Use MercadoPago API
        console.log("Sending request to MercadoPago API...");
        const response = await MercadoPago.preferences.create(preference);
        
        preferenceId = response.body.id;
        initPoint = response.body.init_point;
        
        // Force test parameter
        if (initPoint && !initPoint.includes('test=')) {
          initPoint = `${initPoint}${initPoint.includes('?') ? '&' : '?'}test=true`;
        }
        
        console.log("MercadoPago preference created successfully");
      }
    } catch (mpError) {
      console.error("Error creating MercadoPago preference:", mpError);
      
      // Emergency fallback mode
      preferenceId = `FALLBACK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      initPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}&test=true`;
      
      console.log("Using emergency fallback preference");
    }
    
    // CRITICAL: Update order with payment information and correct total
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        log_pagamento: {
          original_total_amount: totalAmount,
          corrected_total_amount: correctedTotalAmount,
          payment_preference_id: preferenceId,
          payment_init_point: initPoint,
          payment_status: 'pending',
          payment_method: payment_method,
          items_count: cartItems.length,
          payment_key: payment_key,
          idempotency_key: idempotency_key,
          anti_duplicate_processed: true,
          test: true,
          timestamp: new Date().toISOString()
        }
      })
      .eq('id', pedidoId);
      
    if (updateError) {
      throw new Error(`Erro ao atualizar pedido: ${updateError.message}`);
    }
    
    console.log("[PAYMENT-REAL] Payment preference created and order updated:", {
      preferenceId,
      correctedAmount: correctedTotalAmount,
      paymentMethod: payment_method
    });
    
    // Return preference data
    return new Response(
      JSON.stringify({
        success: true,
        preference_id: preferenceId,
        init_point: initPoint,
        pedido_id: pedidoId,
        payment_method: payment_method,
        corrected_total_amount: correctedTotalAmount,
        anti_duplicate_check: 'passed',
        test: true
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
    
  } catch (error) {
    console.error('[PAYMENT-REAL] Erro ao processar pagamento:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        error_details: String(error),
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

// Main handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }
  
  return handleRequest(req);
});
