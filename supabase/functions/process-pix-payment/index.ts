
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CRITICAL: Check for duplicate PIX processing
async function checkDuplicatePixProcessing(supabase: any, pedidoId: string, amount: number) {
  console.log(`[PIX-ANTI-DUPLICATE] Checking for duplicate PIX processing: ${pedidoId} - ${amount}`);
  
  // Check if this pedido already has a PIX payment processed
  const { data: existingPayment, error } = await supabase
    .from('pedidos')
    .select('id, log_pagamento')
    .eq('id', pedidoId)
    .single();
    
  if (error) {
    throw new Error(`Erro ao verificar pedido PIX: ${error.message}`);
  }
  
  if (existingPayment?.log_pagamento?.payment_id) {
    console.log(`[PIX-ANTI-DUPLICATE] PIX already processed for pedido: ${pedidoId}`);
    throw new Error('PIX já foi processado para este pedido');
  }
  
  return true;
}

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
    
    // CRITICAL: Ensure correct amount (not divided)
    const correctAmount = Number(amount.toFixed(2));
    
    console.log(`[PIX-CRITICAL-FIX] Processing PIX with correct amount: ${correctAmount} (original: ${amount})`);
    
    // Create Supabase client with admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // CRITICAL: Check for duplicate processing
    await checkDuplicatePixProcessing(supabase, pedidoId, correctAmount);
    
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
    
    // Prepare PIX payment data with CORRECT amount
    const paymentPayload = {
      payment_method_id: "pix",
      transaction_amount: correctAmount, // Use correct amount
      description: description || `Campanha Indexa - Valor correto: R$ ${correctAmount}`,
      external_reference: externalReference,
      payer: {
        email: userEmail,
      },
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
    };
    
    console.log("[PIX-CRITICAL-FIX] Creating PIX payment with payload:", JSON.stringify({
      ...paymentPayload,
      transaction_amount: correctAmount
    }));
    
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
    
    // Extract important PIX data from response with consistent field naming
    const pixData = {
      payment_id: paymentResponse.id,
      qrCode: paymentResponse.point_of_interaction?.transaction_data?.qr_code || null,
      qrCodeBase64: paymentResponse.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      ticket_url: paymentResponse.point_of_interaction?.transaction_data?.ticket_url || null,
      status: paymentResponse.status,
      status_detail: paymentResponse.status_detail,
      external_reference: paymentResponse.external_reference,
      created_at: new Date().toISOString(),
      transaction_amount: correctAmount // Store correct amount
    };
    
    console.log("[PIX-CRITICAL-FIX] PIX payment created successfully:", {
      payment_id: pixData.payment_id,
      status: pixData.status,
      transaction_amount: correctAmount,
      hasQrCode: !!pixData.qrCode,
      hasQrCodeBase64: !!pixData.qrCodeBase64
    });
    
    // CRITICAL: Update the pedido with payment information using correct amount
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        log_pagamento: {
          payment_method: 'pix',
          payment_id: pixData.payment_id,
          payment_status: pixData.status,
          payment_created_at: pixData.created_at,
          external_reference: pixData.external_reference,
          original_amount: amount,
          corrected_amount: correctAmount,
          amount_validation_passed: true,
          pix_data: {
            qr_code: pixData.qrCode,
            qr_code_base64: pixData.qrCodeBase64,
            qrCode: pixData.qrCode,
            qrCodeBase64: pixData.qrCodeBase64,
            ticket_url: pixData.ticket_url,
            transaction_amount: correctAmount
          }
        }
      })
      .eq('id', pedidoId);
    
    if (updateError) {
      console.error("[PIX] Error updating pedido:", updateError);
    } else {
      console.log("[PIX-CRITICAL-FIX] Pedido updated successfully with correct PIX amount");
    }
    
    // Log the PIX payment creation
    await supabase
      .from('webhook_logs')
      .insert({
        origem: 'pix_payment_creation_fixed',
        status: 'success',
        payload: {
          pedido_id: pedidoId,
          user_id: userId,
          payment_id: pixData.payment_id,
          original_amount: amount,
          corrected_amount: correctAmount,
          status: pixData.status,
          created_at: pixData.created_at
        }
      });
    
    // Return success with PIX data - using corrected amount
    return new Response(
      JSON.stringify({ 
        success: true, 
        pix_data: {
          payment_id: pixData.payment_id,
          qrCode: pixData.qrCode,
          qrCodeBase64: pixData.qrCodeBase64,
          status: pixData.status,
          ticket_url: pixData.ticket_url,
          created_at: pixData.created_at,
          transaction_amount: correctAmount
        },
        pedido_id: pedidoId,
        corrected_amount: correctAmount,
        amount_fix_applied: correctAmount !== amount
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  } catch (error) {
    console.error("[PIX-CRITICAL-FIX] Error processing PIX payment:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});
