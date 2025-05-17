
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  
  try {
    // Get request data
    const requestData = await req.json();
    
    // Extract payment details
    const { 
      amount, 
      pedidoId,
      description, 
      userId,
      userEmail,
      returnUrl
    } = requestData;
    
    if (!amount || !pedidoId || !userId || !userEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required payment data' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }
    
    // Create Supabase client with admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get MercadoPago access token from environment variables
    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!mercadoPagoToken) {
      console.error("[PIX] Missing MercadoPago API token");
      return new Response(
        JSON.stringify({ success: false, error: 'Payment service configuration error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }
    
    // Generate external reference with format CLIENTE{pedido_id}/{user_id}
    const externalReference = `CLIENTE${pedidoId}/${userId}`;
    
    // Prepare PIX payment data
    const paymentPayload = {
      payment_method_id: "pix",
      transaction_amount: parseFloat(amount),
      description: description || "Compra Painéis Indexa",
      external_reference: externalReference,
      payer: {
        email: userEmail,
      },
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
    };
    
    console.log("[PIX] Creating payment with payload:", JSON.stringify(paymentPayload));
    
    // Make request to MercadoPago API to create PIX payment
    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mercadoPagoToken}`
      },
      body: JSON.stringify(paymentPayload)
    });
    
    const paymentResponse = await response.json();
    
    if (!response.ok) {
      console.error("[PIX] MercadoPago API error:", paymentResponse);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `MercadoPago error: ${paymentResponse.message || 'Unknown error'}` 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }
    
    // Extract important PIX data from response
    const pixData = {
      payment_id: paymentResponse.id,
      qr_code: paymentResponse.point_of_interaction?.transaction_data?.qr_code || null,
      qr_code_base64: paymentResponse.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      ticket_url: paymentResponse.point_of_interaction?.transaction_data?.ticket_url || null,
      status: paymentResponse.status,
      status_detail: paymentResponse.status_detail,
      external_reference: paymentResponse.external_reference
    };
    
    // Update the pedido with payment information
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        log_pagamento: {
          payment_method: 'pix',
          payment_id: pixData.payment_id,
          payment_status: pixData.status,
          payment_created_at: new Date().toISOString(),
          pix_data: pixData
        }
      })
      .eq('id', pedidoId);
    
    if (updateError) {
      console.error("[PIX] Error updating pedido:", updateError);
    }
    
    // Log the PIX payment creation
    await supabase
      .from('webhook_logs')
      .insert({
        origem: 'pix_payment_creation',
        status: 'success',
        payload: {
          pedido_id: pedidoId,
          user_id: userId,
          payment_id: pixData.payment_id,
          amount,
          status: pixData.status
        }
      });
    
    // Return success with PIX data
    return new Response(
      JSON.stringify({ 
        success: true, 
        pix_data: pixData,
        pedido_id: pedidoId
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  } catch (error) {
    console.error("[PIX] Error processing payment:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});
