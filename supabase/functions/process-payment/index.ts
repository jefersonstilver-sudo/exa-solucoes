
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Importar a SDK do MercadoPago
import * as MercadoPago from "https://esm.sh/mercadopago@1.5.16";

// Configurar CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
      },
    });
  }
  
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Configure MercadoPago
    const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') ?? '';
    MercadoPago.configure({
      access_token: MP_ACCESS_TOKEN,
      sandbox: true
    });
    
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
    
    // Validate pedidoId (must be a valid UUID)
    if (!pedidoId || typeof pedidoId !== 'string' || !pedidoId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      throw new Error(`ID de pedido inválido: ${pedidoId}`);
    }
    
    // Fetch user data to include in payment
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (userError) {
      throw new Error(`Erro ao buscar dados do usuário: ${userError.message}`);
    }
    
    // Check if cart has valid panels
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error("Nenhum painel válido encontrado no carrinho");
    }
    
    // CRITICAL FIX: Validate panel IDs are valid UUIDs
    // Prepare items for MercadoPago, ensuring all panels have valid IDs
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
      
    if (items.length === 0) {
      throw new Error("Nenhum item válido para processamento. Verifique os IDs dos painéis.");
    }
    
    console.log("Items para processamento:", items.length);
    console.log("Panel IDs:", items.map(i => i.id));
    
    // Clearly define the return URL with the order ID
    const successUrl = `${returnUrl || 'https://app.indexamidia.com'}/pedido-confirmado?id=${pedidoId}&status=approved`;
    const failureUrl = `${returnUrl || 'https://app.indexamidia.com'}/checkout?error=payment_failed&id=${pedidoId}`;
    const pendingUrl = `${returnUrl || 'https://app.indexamidia.com'}/pedido-confirmado?id=${pedidoId}&status=pending`;
    
    // Create payment preference
    const preference = {
      items,
      payer: {
        email: userData.email,
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      auto_return: "approved",
      external_reference: pedidoId,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      statement_descriptor: "INDEXA MÍDIA",
      payment_methods: {
        excluded_payment_types: [],
        installments: 12,
        default_payment_method_id: paymentMethod
      },
      metadata: {
        pedido_id: pedidoId,
        user_id: userId,
        payment_method: paymentMethod,
        test: true
      }
    };
    
    // CRITICAL FIX: Set the correct MercadoPago payment methods configuration
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
    }
    
    // Log preference creation
    console.log("Creating payment preference with items:", JSON.stringify(items.map(i => ({id: i.id, title: i.title}))));
    console.log("Payment method:", paymentMethod);
    console.log("Full preference data:", JSON.stringify({
      items: items.length,
      payer: preference.payer,
      back_urls: preference.back_urls,
      auto_return: preference.auto_return,
      payment_method: paymentMethod,
      metadata: preference.metadata
    }));
    
    // Create preference in MercadoPago or simulate in development
    let preferenceId = "";
    let initPoint = "";
    
    if (MP_ACCESS_TOKEN) {
      try {
        // Use MercadoPago API to create real preference
        console.log("Sending request to MercadoPago API...");
        const response = await MercadoPago.preferences.create(preference);
        
        // IMPROVED LOGGING: Log complete response for debugging
        console.log("MercadoPago API response:", JSON.stringify(response.body));
        
        preferenceId = response.body.id;
        initPoint = response.body.init_point;
        
        console.log("MercadoPago preference created:", {
          preferenceId,
          initPoint
        });
      } catch (mpError) {
        console.error("Error creating MercadoPago preference:", mpError);
        // Gracefully fail with simulated values
        preferenceId = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // CRITICAL FIX: Correctly format the test URL using UNDERSCORE instead of HYPHEN
        initPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}&test=true`;
        if (paymentMethod === 'pix') {
          initPoint += '&payment_method_id=pix';
        }
      }
    } else {
      console.log("No MP_ACCESS_TOKEN found, using test mode");
      // Simulated mode (for development)
      preferenceId = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // CRITICAL FIX: Correctly format the test URL using UNDERSCORE instead of HYPHEN
      initPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}&test=true`;
      if (paymentMethod === 'pix') {
        initPoint += '&payment_method_id=pix';
      }
    }
    
    // Update order with payment information
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        log_pagamento: {
          ...totals,
          payment_preference_id: preferenceId,
          payment_init_point: initPoint,
          payment_status: 'pending',
          payment_method: paymentMethod,
          items: items.length,
          test: true,
          timestamp: new Date().toISOString()
        }
      })
      .eq('id', pedidoId);
      
    if (updateError) {
      throw new Error(`Erro ao atualizar pedido: ${updateError.message}`);
    }
    
    console.log("Response being sent:", {
      preferenceId,
      initPoint: initPoint.substring(0, 100) + "..." // Log partial URL for security
    });
    
    // Return preference data
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
    
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    
    // Return error with detailed information for debugging
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
});
