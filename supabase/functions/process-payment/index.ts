
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { PaymentRequestData, PaymentResponse } from './types.ts';
import { validatePaymentData } from './validation.ts';
import { checkDuplicateProcessing } from './duplicateCheck.ts';
import { configureMercadoPago, createPaymentItems, createPaymentPreference, createMercadoPagoPreference } from './mercadoPago.ts';
import { fetchUserData, updatePedidoWithPayment } from './database.ts';
import { createReturnUrls, createCorsHeaders, handleCorsPreflightRequest, createSupabaseClient } from './utils.ts';

async function handleRequest(req: Request): Promise<Response> {
  try {
    // Create Supabase client
    const { supabaseUrl, supabaseKey } = createSupabaseClient();
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Configure MercadoPago
    const MP_ACCESS_TOKEN = configureMercadoPago();
    
    // Get request data
    const requestData: PaymentRequestData = await req.json();
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
    
    console.log("[CRITICAL-FIX] Dados recebidos:", { 
      pedidoId, 
      totalAmount, 
      userId, 
      paymentMethod: payment_method, 
      cartItemsCount: cartItems?.length,
      paymentKey,
      antiDuplicateControls: anti_duplicate_controls
    });
    
    // Validate request data
    validatePaymentData(requestData);
    
    // Check for duplicate processing
    if (payment_key) {
      await checkDuplicateProcessing(supabase, payment_key, pedidoId);
    }
    
    // Fetch user data
    const userData = await fetchUserData(supabase, userId);
    
    // Use the correct total amount directly
    const correctedTotalAmount = Number(totalAmount.toFixed(2));
    
    console.log(`[CRITICAL-FIX] Valor corrigido: ${correctedTotalAmount} (original: ${totalAmount})`);
    
    // Prepare MercadoPago items
    const items = createPaymentItems(pedidoId, cartItems, correctedTotalAmount);
    
    // Prepare return URLs
    const returnUrls = createReturnUrls(returnUrl || '', pedidoId);
    
    // Create MercadoPago preference
    const preference = createPaymentPreference(
      items,
      userData?.email || '',
      returnUrls,
      pedidoId,
      userId,
      payment_method,
      payment_key || '',
      idempotency_key || '',
      correctedTotalAmount,
      supabaseUrl
    );
    
    console.log(`[CRITICAL-FIX] Criando preferência com valor: ${correctedTotalAmount}`);
    
    // Create preference in MercadoPago
    const { preferenceId, initPoint } = await createMercadoPagoPreference(preference, MP_ACCESS_TOKEN);
    
    // Update order with payment information
    await updatePedidoWithPayment(
      supabase,
      pedidoId,
      totalAmount,
      correctedTotalAmount,
      preferenceId,
      initPoint,
      payment_method,
      cartItems,
      payment_key || '',
      idempotency_key || ''
    );
    
    console.log("[CRITICAL-FIX] Payment preference created and order updated:", {
      preferenceId,
      correctedAmount: correctedTotalAmount,
      paymentMethod: payment_method
    });
    
    // Return preference data
    const response: PaymentResponse = {
      success: true,
      preference_id: preferenceId,
      init_point: initPoint,
      pedido_id: pedidoId,
      payment_method: payment_method,
      corrected_total_amount: correctedTotalAmount,
      anti_duplicate_check: 'passed',
      test: true
    };
    
    return new Response(
      JSON.stringify(response),
      {
        headers: {
          'Content-Type': 'application/json',
          ...createCorsHeaders(),
        },
      }
    );
    
  } catch (error) {
    console.error('[CRITICAL-FIX] Erro ao processar pagamento:', error);
    
    const errorResponse: PaymentResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      error_details: String(error),
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...createCorsHeaders(),
        },
      }
    );
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }
  
  return handleRequest(req);
});
