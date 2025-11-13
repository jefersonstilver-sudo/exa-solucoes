import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    // Get Stripe signature
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature provided");
    }

    // Get webhook secret
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    // Get raw body for signature verification
    const body = await req.text();
    
    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { eventType: event.type });
    } catch (err) {
      logStep("ERROR: Invalid signature", { error: err.message });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Process different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.completed", { sessionId: session.id });

        const pedidoId = session.metadata?.pedido_id;
        if (!pedidoId) {
          logStep("WARNING: No pedido_id in metadata");
          break;
        }

        // Fetch order
        const { data: orderData, error: fetchError } = await supabaseClient
          .from('pedidos')
          .select('*')
          .eq('id', pedidoId)
          .single();

        if (fetchError || !orderData) {
          logStep("ERROR: Order not found", { pedidoId, error: fetchError?.message });
          break;
        }

        // Update log_pagamento
        const logPagamento = orderData.log_pagamento as any || {};
        logPagamento.payment_intent_id = session.payment_intent;
        logPagamento.checkout_completed_at = new Date().toISOString();
        logPagamento.payment_status = session.payment_status;

        const { error: updateError } = await supabaseClient
          .from('pedidos')
          .update({ 
            log_pagamento: logPagamento,
          })
          .eq('id', pedidoId);

        if (updateError) {
          logStep("ERROR updating order", { error: updateError.message });
        } else {
          logStep("Order updated with payment intent", { pedidoId, paymentIntent: session.payment_intent });
        }

        // Log event
        await supabaseClient.from('log_eventos_sistema').insert({
          tipo_evento: 'STRIPE_CHECKOUT_COMPLETED',
          descricao: `Stripe checkout completed for order ${pedidoId}`,
          detalhes: {
            pedido_id: pedidoId,
            session_id: session.id,
            payment_intent_id: session.payment_intent,
            payment_status: session.payment_status,
          },
        });

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Processing payment_intent.succeeded", { paymentIntentId: paymentIntent.id });

        // Find order by payment_intent_id in log_pagamento
        const { data: orders, error: searchError } = await supabaseClient
          .from('pedidos')
          .select('*')
          .contains('log_pagamento', { payment_intent_id: paymentIntent.id });

        if (searchError || !orders || orders.length === 0) {
          logStep("WARNING: No order found for payment intent", { paymentIntentId: paymentIntent.id });
          break;
        }

        const order = orders[0];
        const pedidoId = order.id;

        // Check if already processed (anti-duplication)
        if (order.transaction_id === paymentIntent.id) {
          logStep("Payment already processed", { pedidoId });
          break;
        }

        // Update order status to paid
        const { error: updateError } = await supabaseClient
          .from('pedidos')
          .update({ 
            status: 'pago_pendente_video',
            transaction_id: paymentIntent.id,
            data_aprovacao: new Date().toISOString(),
          })
          .eq('id', pedidoId);

        if (updateError) {
          logStep("ERROR updating order status", { error: updateError.message });
        } else {
          logStep("Order status updated to pago_pendente_video", { pedidoId });
        }

        // Insert payment status tracking
        await supabaseClient.from('payment_status_tracking').insert({
          pedido_id: pedidoId,
          old_status: order.status,
          new_status: 'pago_pendente_video',
          payment_method: 'stripe',
          transaction_id: paymentIntent.id,
          changed_by: 'stripe_webhook',
        });

        // Log event
        await supabaseClient.from('log_eventos_sistema').insert({
          tipo_evento: 'STRIPE_PAYMENT_SUCCEEDED',
          descricao: `Stripe payment succeeded for order ${pedidoId}`,
          detalhes: {
            pedido_id: pedidoId,
            payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
          },
        });

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Processing payment_intent.payment_failed", { paymentIntentId: paymentIntent.id });

        // Find order by payment_intent_id
        const { data: orders, error: searchError } = await supabaseClient
          .from('pedidos')
          .select('*')
          .contains('log_pagamento', { payment_intent_id: paymentIntent.id });

        if (searchError || !orders || orders.length === 0) {
          logStep("WARNING: No order found for payment intent", { paymentIntentId: paymentIntent.id });
          break;
        }

        const order = orders[0];
        const pedidoId = order.id;

        // Update order status to canceled
        const { error: updateError } = await supabaseClient
          .from('pedidos')
          .update({ 
            status: 'cancelado',
            transaction_id: paymentIntent.id,
          })
          .eq('id', pedidoId);

        if (updateError) {
          logStep("ERROR updating order status", { error: updateError.message });
        } else {
          logStep("Order status updated to cancelado", { pedidoId });
        }

        // Insert payment status tracking
        await supabaseClient.from('payment_status_tracking').insert({
          pedido_id: pedidoId,
          old_status: order.status,
          new_status: 'cancelado',
          payment_method: 'stripe',
          transaction_id: paymentIntent.id,
          changed_by: 'stripe_webhook',
        });

        // Log event
        await supabaseClient.from('log_eventos_sistema').insert({
          tipo_evento: 'STRIPE_PAYMENT_FAILED',
          descricao: `Stripe payment failed for order ${pedidoId}`,
          detalhes: {
            pedido_id: pedidoId,
            payment_intent_id: paymentIntent.id,
            error: paymentIntent.last_payment_error?.message,
          },
        });

        break;
      }

      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
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
