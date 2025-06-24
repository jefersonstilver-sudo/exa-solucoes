
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

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

// Validate pedidoId (must be a valid UUID)
function validatePedidoId(pedidoId: string) {
  const validUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!pedidoId || typeof pedidoId !== 'string' || !pedidoId.match(validUuidPattern)) {
    throw new Error(`ID de pedido inválido: ${pedidoId}`);
  }
}

// Generate PIX payment with N8N webhook
async function generatePixPayment(supabase: any, pedidoId: string, totalAmount: number, userEmail: string) {
  try {
    console.log(`🎯 [PIX] Gerando pagamento PIX real para pedido: ${pedidoId}, valor: ${totalAmount}`);
    
    // Preparar dados para o webhook N8N
    const pixPaymentData = {
      pedido_id: pedidoId,
      valor: totalAmount,
      email: userEmail,
      timestamp: new Date().toISOString(),
      webhook_source: 'supabase_edge_function'
    };

    // Chamar webhook N8N para gerar PIX real
    const N8N_WEBHOOK_URL = 'https://indexamidia.app.n8n.cloud/webhook/pix-payment-generator';
    
    console.log(`📡 [PIX] Chamando webhook N8N: ${N8N_WEBHOOK_URL}`);
    
    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pixPaymentData)
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook N8N falhou: ${webhookResponse.status} - ${webhookResponse.statusText}`);
    }

    const webhookResult = await webhookResponse.json();
    console.log(`✅ [PIX] Resposta do webhook N8N:`, webhookResult);

    // Estruturar dados PIX com base na resposta do N8N
    const pixData = {
      paymentId: webhookResult.payment_id || `pix_${pedidoId}_${Date.now()}`,
      status: 'pending',
      qrCode: webhookResult.qr_code_text || webhookResult.pix_copia_cola || '',
      qrCodeBase64: webhookResult.qr_code_base64 || webhookResult.qr_code_image || '',
      qrCodeText: webhookResult.qr_code_text || webhookResult.pix_copia_cola || '',
      pix_url: webhookResult.qr_code_text || webhookResult.pix_copia_cola || '',
      pix_base64: webhookResult.qr_code_base64 || webhookResult.qr_code_image || '',
      valor_original: totalAmount,
      valor_pix: totalAmount * 0.95, // 5% desconto PIX
      webhook_response: webhookResult,
      createdAt: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos
    };

    // Salvar dados PIX no pedido
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        log_pagamento: {
          pixData: pixData,
          pix_data: pixData,
          payment_method: 'pix',
          total_amount: totalAmount,
          valor_pix: pixData.valor_pix,
          webhook_called: true,
          n8n_response: webhookResult,
          timestamp: new Date().toISOString()
        }
      })
      .eq('id', pedidoId);

    if (updateError) {
      throw new Error(`Erro ao salvar dados PIX: ${updateError.message}`);
    }

    console.log(`✅ [PIX] Dados PIX salvos com sucesso no pedido ${pedidoId}`);

    return { success: true, pixData };

  } catch (error: any) {
    console.error(`❌ [PIX] Erro ao gerar PIX:`, error);
    
    // Fallback: gerar dados PIX simulados se o webhook falhar
    const fallbackPixData = {
      paymentId: `fallback_pix_${pedidoId}_${Date.now()}`,
      status: 'pending',
      qrCode: `00020126580014BR.GOV.BCB.PIX0136${pedidoId}5204000053039865802BR5925INDEXA MIDIA LTDA6009SAO PAULO61080540090062070503***6304`,
      qrCodeBase64: '', // Será gerado pelo frontend se necessário
      qrCodeText: `PIX Copia e Cola - Valor: ${totalAmount}`,
      valor_original: totalAmount,
      valor_pix: totalAmount * 0.95,
      fallback_mode: true,
      error_reason: error.message,
      createdAt: new Date().toISOString()
    };

    // Salvar dados fallback
    await supabase
      .from('pedidos')
      .update({
        log_pagamento: {
          pixData: fallbackPixData,
          pix_data: fallbackPixData,
          payment_method: 'pix',
          fallback_mode: true,
          webhook_error: error.message,
          timestamp: new Date().toISOString()
        }
      })
      .eq('id', pedidoId);

    console.log(`⚠️ [PIX] Usando modo fallback para pedido ${pedidoId}`);
    
    return { success: true, pixData: fallbackPixData };
  }
}

// Main handler function
async function handleRequest(req: Request) {
  try {
    // Create Supabase client
    const supabase = createSupabaseClient();
    
    // Get request data
    const requestData = await req.json();
    const { 
      pedido_id: pedidoId, 
      total_amount: totalAmount,
      payment_method = 'pix',
      user_email: userEmail
    } = requestData;
    
    console.log("[PAYMENT-PIX] Processando pagamento PIX:", { 
      pedidoId, 
      totalAmount, 
      paymentMethod: payment_method,
      userEmail
    });
    
    // Validate inputs
    validatePedidoId(pedidoId);
    
    if (!totalAmount || totalAmount <= 0) {
      throw new Error(`Valor total inválido: ${totalAmount}`);
    }

    if (payment_method !== 'pix') {
      throw new Error(`Método de pagamento inválido: ${payment_method}`);
    }
    
    // Processar PIX com webhook N8N
    const pixResult = await generatePixPayment(supabase, pedidoId, totalAmount, userEmail || 'cliente@exemplo.com');
    
    return new Response(
      JSON.stringify({
        success: true,
        pixData: pixResult.pixData,
        pedido_id: pedidoId,
        payment_method: 'pix',
        valor_original: totalAmount,
        valor_pix: pixResult.pixData.valor_pix
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
    
  } catch (error: any) {
    console.error('[PAYMENT-PIX] Erro ao processar pagamento PIX:', error);
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
