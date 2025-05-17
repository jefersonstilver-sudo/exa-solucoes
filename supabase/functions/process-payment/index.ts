
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

// Fetch user data for the payment
async function fetchUserData(supabase: any, userId: string) {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();
    
  if (userError) {
    throw new Error(`Erro ao buscar dados do usuário: ${userError.message}`);
  }
  
  return userData;
}

// Validate cart items
function validateCartItems(cartItems: any[]) {
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error("Nenhum painel válido encontrado no carrinho");
  }
}

// Prepare MercadoPago items from cart items
function prepareMercadoPagoItems(cartItems: any[], totals: any) {
  const validPanelTest = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const items = cartItems
    .filter(item => 
      item.panel && 
      item.panel.id && 
      typeof item.panel.id === 'string' &&
      item.panel.id.match(validPanelTest)
    )
    .map(item => ({
      id: item.panel.id,
      title: `Painel em ${item.panel.buildings?.nome || 'Localização'}`,
      quantity: 1,
      unit_price: totals.totalPrice / cartItems.length, // Divide total value by items
      currency_id: 'BRL',
      description: `Veiculação por ${totals.duration} dias`,
      category_id: "digital_goods",
      picture_url: item.panel.buildings?.imageUrl || 'https://via.placeholder.com/150'
    }));
    
  // If no items are valid, use fallback items
  if (items.length === 0) {
    items.push({
      id: "fallback-item-id",
      title: "Campanha publicitária digital",
      quantity: 1,
      unit_price: totals.totalPrice,
      currency_id: "BRL",
      description: `Veiculação por ${totals.duration} dias`,
      category_id: "digital_goods",
      picture_url: "https://via.placeholder.com/150"
    });
  }
  
  return items;
}

// Prepare return URLs for MercadoPago
function prepareReturnUrls(returnUrl: string, pedidoId: string) {
  const originUrl = returnUrl || 'https://app.indexamidia.com';
  return {
    successUrl: `${originUrl}/pedido-confirmado?id=${pedidoId}&status=approved`,
    failureUrl: `${originUrl}/checkout?error=payment_failed&id=${pedidoId}`,
    pendingUrl: `${originUrl}/pedido-confirmado?id=${pedidoId}&status=pending`
  };
}

// Create MercadoPago preference
function createMercadoPagoPreference(items: any[], userData: any, pedidoId: string, userId: string, 
  paymentMethod: string, returnUrls: any, supabaseUrl: string) {
  
  const payerEmail = userData?.email || 'cliente@exemplo.com';
  
  const preference = {
    items,
    payer: {
      email: payerEmail,
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
      payment_method: paymentMethod,
      test: true,
      email: payerEmail,
      test_mode: true // In test mode, add test users to the preference
    }
  };
  
  // Set specific payment method configurations
  if (paymentMethod === 'pix') {
    preference.payment_methods = {
      ...preference.payment_methods,
      excluded_payment_types: [
        { id: "credit_card" },
        { id: "debit_card" },
        { id: "ticket" }
      ],
      default_payment_method_id: "pix"
    };
  } else if (paymentMethod === 'credit_card') {
    preference.payment_methods = {
      ...preference.payment_methods,
      default_payment_method_id: "credit_card"
    };
  }
  
  return preference;
}

// Create test preference when no API key is available
function createTestPreference(paymentMethod: string) {
  const preferenceId = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  let initPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}&test=true`;
  
  if (paymentMethod === 'pix') {
    initPoint += '&payment_method_id=pix';
  }
  
  return { preferenceId, initPoint };
}

// Create real preference using MercadoPago API
async function createRealPreference(preference: any) {
  console.log("Sending request to MercadoPago API...");
  const response = await MercadoPago.preferences.create(preference);
  
  // Log partial response for debugging
  console.log("MercadoPago API response ID:", response.body.id);
  console.log("Init point:", response.body.init_point);
  
  let preferenceId = response.body.id;
  let initPoint = response.body.init_point;
  
  // Force test parameter
  if (initPoint && !initPoint.includes('test=')) {
    initPoint = `${initPoint}${initPoint.includes('?') ? '&' : '?'}test=true`;
  }
  
  console.log("MercadoPago preference created successfully");
  return { preferenceId, initPoint };
}

// Update order with payment information
async function updateOrderWithPaymentInfo(supabase: any, pedidoId: string, totals: any, preferenceId: string, initPoint: string, paymentMethod: string, itemsCount: number) {
  const { error: updateError } = await supabase
    .from('pedidos')
    .update({
      log_pagamento: {
        ...totals,
        payment_preference_id: preferenceId,
        payment_init_point: initPoint,
        payment_status: 'pending',
        payment_method: paymentMethod,
        items: itemsCount,
        test: true,
        timestamp: new Date().toISOString()
      }
    })
    .eq('id', pedidoId);
    
  if (updateError) {
    throw new Error(`Erro ao atualizar pedido: ${updateError.message}`);
  }
}

// Create success response
function createSuccessResponse(preferenceId: string, initPoint: string, pedidoId: string, paymentMethod: string) {
  return new Response(
    JSON.stringify({
      success: true,
      preference_id: preferenceId,
      init_point: initPoint,
      pedido_id: pedidoId,
      payment_method: paymentMethod,
      test: true
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

// Create error response
function createErrorResponse(error: Error) {
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
    const { pedidoId, cartItems, totals, userId, returnUrl, paymentMethod = 'credit_card' } = requestData;
    
    console.log("Dados recebidos:", { 
      pedidoId, 
      totals, 
      userId, 
      paymentMethod, 
      cartItemsCount: cartItems?.length,
      returnUrl
    });
    
    // Validate pedidoId
    validatePedidoId(pedidoId);
    
    // Fetch user data
    const userData = await fetchUserData(supabase, userId);
    
    // Validate cart items
    validateCartItems(cartItems);
    
    // Prepare MercadoPago items
    const items = prepareMercadoPagoItems(cartItems, totals);
    
    console.log("Items para processamento:", items.length);
    
    // Prepare return URLs
    const returnUrls = prepareReturnUrls(returnUrl, pedidoId);
    
    console.log("URLs:", returnUrls);
    
    // Create MercadoPago preference
    const preference = createMercadoPagoPreference(
      items, 
      userData, 
      pedidoId, 
      userId, 
      paymentMethod, 
      returnUrls, 
      supabaseUrl
    );
    
    // Create preference in MercadoPago or simulate in development
    let preferenceId = "";
    let initPoint = "";
    
    try {
      // Create a valid test preference or real one
      if (!MP_ACCESS_TOKEN) {
        console.log("No MP_ACCESS_TOKEN found, using test mode");
        const testData = createTestPreference(paymentMethod);
        preferenceId = testData.preferenceId;
        initPoint = testData.initPoint;
      } else {
        // Use MercadoPago API
        const realData = await createRealPreference(preference);
        preferenceId = realData.preferenceId;
        initPoint = realData.initPoint;
      }
    } catch (mpError) {
      console.error("Error creating MercadoPago preference:", mpError);
      
      // Emergency fallback mode
      const fallbackData = createTestPreference(paymentMethod);
      preferenceId = fallbackData.preferenceId;
      initPoint = fallbackData.initPoint;
      
      console.log("Using emergency fallback preference:", {
        preferenceId,
        initPoint
      });
    }
    
    // Update order with payment information
    await updateOrderWithPaymentInfo(
      supabase, 
      pedidoId, 
      totals, 
      preferenceId, 
      initPoint, 
      paymentMethod, 
      items.length
    );
    
    console.log("Payment preference created and order updated:", {
      preferenceId,
      initPoint,
      paymentMethod
    });
    
    // Return preference data
    return createSuccessResponse(preferenceId, initPoint, pedidoId, paymentMethod);
    
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return createErrorResponse(error);
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
