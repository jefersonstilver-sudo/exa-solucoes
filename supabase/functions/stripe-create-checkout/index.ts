import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body
    const { pedidoId } = await req.json();
    if (!pedidoId) throw new Error("pedidoId is required");
    logStep("Received pedidoId", { pedidoId });

    // Fetch order data
    const { data: orderData, error: orderError } = await supabaseClient
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (orderError || !orderData) {
      throw new Error(`Order not found: ${orderError?.message || 'No data'}`);
    }
    logStep("Order fetched", { orderId: orderData.id, status: orderData.status, total: orderData.valor_total });

    // Verify user owns this order
    if (orderData.client_id !== user.id) {
      throw new Error("User does not have permission to access this order");
    }

    // CRITICAL: Validate Stripe minimum amounts
    const STRIPE_MINIMUM_PIX = 0.50;
    const STRIPE_MINIMUM_CARD = 1.00;
    const minimumAmount = STRIPE_MINIMUM_CARD; // Use card minimum (highest)

    if (orderData.valor_total < minimumAmount) {
      logStep("ERROR: Order value below Stripe minimum", { 
        valor: orderData.valor_total, 
        minimum: minimumAmount 
      });
      
      return new Response(JSON.stringify({ 
        error: `Valor mínimo para pagamento é R$ ${minimumAmount.toFixed(2)}. Seu pedido: R$ ${orderData.valor_total.toFixed(2)}` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if checkout session already exists (anti-duplication)
    if (orderData.checkout_session_id) {
      logStep("Checkout session already exists in dedicated column", { sessionId: orderData.checkout_session_id });
      logStep("Checkout session already exists", { sessionId: logPagamento.checkout_session_id });
      
      // Check if session is still valid in Stripe
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
      
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      
      try {
        const session = await stripe.checkout.sessions.retrieve(logPagamento.checkout_session_id);
        if (session.status === 'open') {
          logStep("Returning existing valid session", { url: session.url });
          return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      } catch (e) {
        logStep("Existing session invalid, creating new one", { error: e.message });
      }
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    logStep("Stripe initialized");

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      logStep("No existing Stripe customer found");
    }

    // Create Checkout Session
    const origin = req.headers.get("origin") || "http://localhost:3000";
    // Create Checkout Session with CORRECTED metadata (pedido_id not pedidoId)
    // 🔴 IMPORTANTE: PIX removido temporariamente - Stripe requer 90 dias de processamento
    // 📝 Para ativar PIX: https://dashboard.stripe.com/settings/payment_methods (após 90 dias)
    // 💳 Atualmente apenas CARTÃO está disponível via Stripe
    // 💵 Para pagamentos PIX, usar MercadoPago via process-payment edge function
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Pedido #${pedidoId.substring(0, 8)}`,
              description: 'Publicidade em painéis de elevadores',
            },
            unit_amount: Math.round(orderData.valor_total * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_method_types: ["card"], // ✅ APENAS CARTÃO - PIX via MercadoPago
      metadata: {
        pedido_id: pedidoId,  // ✅ CORRIGIDO: snake_case para alinhar com webhook
        user_id: user.id      // ✅ CORRIGIDO: snake_case
      },
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/canceled?pedido_id=${pedidoId}`,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update order with checkout_session_id in DEDICATED COLUMN + log_pagamento
    const logPagamento = orderData.log_pagamento as any || {};
    const updatedLogPagamento = {
      ...logPagamento,
      payment_method: "stripe",
      checkout_session_id: session.id,
      created_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseClient
      .from('pedidos')
      .update({ 
        checkout_session_id: session.id,  // ✅ NOVO: Salvar em coluna dedicada
        log_pagamento: updatedLogPagamento 
      })
      .eq('id', pedidoId);

    if (updateError) {
      logStep("ERROR updating order", { error: updateError.message });
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    logStep("Order updated with checkout session in dedicated column");

    // Log to sistema
    await supabaseClient.from('log_eventos_sistema').insert({
      tipo_evento: 'STRIPE_CHECKOUT_CREATED',
      descricao: `Stripe checkout session created for order ${pedidoId}`,
      metadados: {
        pedido_id: pedidoId,
        checkout_session_id: session.id,
        amount: orderData.valor_total,
      },
      user_id: user.id,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
