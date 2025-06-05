
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CRITICAL: Enhanced duplicate checking with financial integrity
async function checkDuplicatePixProcessing(supabase: any, pedidoId: string, amount: number, userId: string) {
  console.log(`[PIX-INTEGRITY-CHECK] Verificação reforçada: ${pedidoId} - ${amount} - ${userId}`);
  
  // Check if this pedido already has a PIX payment processed
  const { data: existingPayment, error } = await supabase
    .from('pedidos')
    .select('id, log_pagamento, valor_total')
    .eq('id', pedidoId)
    .single();
    
  if (error) {
    throw new Error(`Erro ao verificar pedido PIX: ${error.message}`);
  }
  
  if (existingPayment?.log_pagamento?.payment_id) {
    console.log(`[PIX-INTEGRITY-CHECK] PIX já processado para pedido: ${pedidoId}`);
    throw new Error('PIX já foi processado para este pedido');
  }

  // CRITICAL: Check for recent duplicate payments by user and amount
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data: recentPayments, error: recentError } = await supabase
    .from('pedidos')
    .select('id, valor_total, created_at')
    .eq('client_id', userId)
    .eq('valor_total', amount)
    .gte('created_at', fiveMinutesAgo)
    .neq('id', pedidoId);

  if (recentError) {
    console.error('[PIX-INTEGRITY-CHECK] Erro ao verificar pagamentos recentes:', recentError);
  } else if (recentPayments && recentPayments.length > 0) {
    console.log(`[PIX-INTEGRITY-CHECK] DUPLICAÇÃO DETECTADA:`, {
      userId: userId.substring(0, 8),
      amount,
      recentPayments: recentPayments.length,
      pedidoId
    });
    
    // Log the financial integrity violation
    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'PIX_DUPLICATE_DETECTED',
        descricao: `Tentativa de PIX duplicado bloqueada: ${userId} - ${amount} - Pedidos: ${recentPayments.map(p => p.id).join(', ')}`
      });
    
    throw new Error('Detectado pagamento duplicado. Operação bloqueada por segurança.');
  }
  
  return true;
}

// CRITICAL: Validate amount integrity
function validateAmountIntegrity(amount: number, originalAmount: number) {
  const correctedAmount = Number(amount.toFixed(2));
  
  // Check for division errors
  if (correctedAmount !== originalAmount && Math.abs(correctedAmount - originalAmount) > 0.01) {
    console.log(`[PIX-AMOUNT-VALIDATION] Divergência de valor detectada:`, {
      original: originalAmount,
      corrected: correctedAmount,
      difference: Math.abs(correctedAmount - originalAmount)
    });
  }
  
  // Check for suspiciously low values
  if (correctedAmount < 0.01) {
    throw new Error(`Valor inválido: ${correctedAmount}`);
  }
  
  // Check for suspiciously divided values
  if (correctedAmount < 0.10 && originalAmount > correctedAmount) {
    console.log(`[PIX-AMOUNT-VALIDATION] Possível divisão incorreta:`, {
      original: originalAmount,
      corrected: correctedAmount
    });
  }
  
  return correctedAmount;
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
    
    // CRITICAL: Validate amount integrity
    const correctedAmount = validateAmountIntegrity(amount, amount);
    
    console.log(`[PIX-INTEGRITY-FIX] Processing PIX with validated amount: ${correctedAmount} (original: ${amount})`);
    
    // Create Supabase client with admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // CRITICAL: Enhanced duplicate processing check
    await checkDuplicatePixProcessing(supabase, pedidoId, correctedAmount, userId);
    
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
    
    // Generate external reference with enhanced format for tracking
    const timestamp = Date.now();
    const externalReference = `CLIENTE${pedidoId}/${userId}/${timestamp}`;
    
    // Prepare PIX payment data with validated amount
    const paymentPayload = {
      payment_method_id: "pix",
      transaction_amount: correctedAmount,
      description: description || `Campanha Indexa - Valor: R$ ${correctedAmount} - Ref: ${timestamp}`,
      external_reference: externalReference,
      payer: {
        email: userEmail,
      },
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      metadata: {
        pedido_id: pedidoId,
        user_id: userId,
        original_amount: amount,
        corrected_amount: correctedAmount,
        integrity_check: 'passed',
        timestamp: timestamp
      }
    };
    
    console.log("[PIX-INTEGRITY-FIX] Creating PIX payment with enhanced tracking:", JSON.stringify({
      ...paymentPayload,
      transaction_amount: correctedAmount,
      integrity_validated: true
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
    
    // Extract important PIX data from response with enhanced tracking
    const pixData = {
      payment_id: paymentResponse.id,
      qrCode: paymentResponse.point_of_interaction?.transaction_data?.qr_code || null,
      qrCodeBase64: paymentResponse.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      ticket_url: paymentResponse.point_of_interaction?.transaction_data?.ticket_url || null,
      status: paymentResponse.status,
      status_detail: paymentResponse.status_detail,
      external_reference: paymentResponse.external_reference,
      created_at: new Date().toISOString(),
      transaction_amount: correctedAmount,
      integrity_validated: true
    };
    
    console.log("[PIX-INTEGRITY-FIX] PIX payment created successfully:", {
      payment_id: pixData.payment_id,
      status: pixData.status,
      transaction_amount: correctedAmount,
      integrity_check: 'passed',
      hasQrCode: !!pixData.qrCode,
      hasQrCodeBase64: !!pixData.qrCodeBase64
    });
    
    // CRITICAL: Update the pedido with enhanced payment information
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
          corrected_amount: correctedAmount,
          amount_validation_passed: true,
          integrity_check_passed: true,
          duplicate_check_passed: true,
          timestamp: timestamp,
          pix_data: {
            qr_code: pixData.qrCode,
            qr_code_base64: pixData.qrCodeBase64,
            qrCode: pixData.qrCode,
            qrCodeBase64: pixData.qrCodeBase64,
            ticket_url: pixData.ticket_url,
            transaction_amount: correctedAmount
          }
        }
      })
      .eq('id', pedidoId);
    
    if (updateError) {
      console.error("[PIX] Error updating pedido:", updateError);
    } else {
      console.log("[PIX-INTEGRITY-FIX] Pedido updated successfully with enhanced PIX tracking");
    }
    
    // Log the PIX payment creation with enhanced tracking
    await supabase
      .from('webhook_logs')
      .insert({
        origem: 'pix_payment_creation_enhanced',
        status: 'success',
        payload: {
          pedido_id: pedidoId,
          user_id: userId,
          payment_id: pixData.payment_id,
          original_amount: amount,
          corrected_amount: correctedAmount,
          status: pixData.status,
          created_at: pixData.created_at,
          integrity_validated: true,
          timestamp: timestamp
        }
      });
    
    // Return success with enhanced PIX data
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
          transaction_amount: correctedAmount
        },
        pedido_id: pedidoId,
        corrected_amount: correctedAmount,
        integrity_check: 'passed',
        amount_fix_applied: correctedAmount !== amount,
        timestamp: timestamp
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  } catch (error) {
    console.error("[PIX-INTEGRITY-FIX] Error processing PIX payment:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});
