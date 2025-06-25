
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    console.log(`🎯 [PIX] Gerando pagamento PIX para pedido: ${pedidoId}, valor: ${totalAmount}`);
    
    // Valor final com desconto PIX (5%)
    const valorPixComDesconto = totalAmount * 0.95;
    
    // Preparar dados para o webhook N8N
    const pixPaymentData = {
      pedido_id: pedidoId,
      valor: valorPixComDesconto,
      valor_original: totalAmount,
      email: userEmail,
      timestamp: new Date().toISOString(),
      webhook_source: 'supabase_edge_function'
    };

    let pixData;
    let webhookSuccess = false;

    // Chamar webhook N8N correto com timeout de 30 segundos
    try {
      const N8N_WEBHOOK_URL = 'https://stilver.app.n8n.cloud/webhook-test/d8e707ae-093a-4e08-9069-8627eb9c1d19';
      
      console.log(`📡 [PIX] Chamando webhook N8N: ${N8N_WEBHOOK_URL}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
      
      const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pixPaymentData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (webhookResponse.ok) {
        const webhookResult = await webhookResponse.json();
        console.log(`✅ [PIX] Webhook N8N sucesso:`, webhookResult);

        pixData = {
          paymentId: webhookResult.payment_id || `pix_${pedidoId}_${Date.now()}`,
          status: 'pending',
          qrCode: webhookResult.pix_url || webhookResult.qr_code_text || webhookResult.pix_copia_cola,
          qrCodeBase64: webhookResult.pix_base64 || webhookResult.qr_code_base64,
          qrCodeText: webhookResult.pix_url || webhookResult.qr_code_text || webhookResult.pix_copia_cola,
          pix_url: webhookResult.pix_url || webhookResult.qr_code_text || webhookResult.pix_copia_cola,
          pix_base64: webhookResult.pix_base64 || webhookResult.qr_code_base64,
          valor_original: totalAmount,
          valor_pix: valorPixComDesconto,
          webhook_response: webhookResult,
          webhook_success: true,
          createdAt: new Date().toISOString(),
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutos
        };
        
        webhookSuccess = true;
      } else {
        throw new Error(`Webhook retornou status ${webhookResponse.status}`);
      }
    } catch (webhookError) {
      console.warn(`⚠️ [PIX] Webhook N8N falhou:`, webhookError);
      throw new Error(`Falha no webhook N8N: ${webhookError.message}`);
    }

    // Salvar dados PIX no pedido
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        log_pagamento: {
          pixData: pixData,
          pix_data: pixData,
          payment_method: 'pix',
          total_amount: totalAmount,
          valor_pix: valorPixComDesconto,
          webhook_called: true,
          webhook_success: webhookSuccess,
          timestamp: new Date().toISOString(),
          qr_code_base64: pixData.qrCodeBase64,
          qr_code_text: pixData.qrCode,
          payment_id: pixData.paymentId,
          expires_at: pixData.expires_at
        }
      })
      .eq('id', pedidoId);

    if (updateError) {
      console.error(`❌ [PIX] Erro ao salvar dados PIX:`, updateError);
      throw new Error(`Erro ao salvar dados PIX: ${updateError.message}`);
    }

    console.log(`✅ [PIX] Dados PIX salvos com sucesso no pedido ${pedidoId}`);

    return { success: true, pixData };

  } catch (error: any) {
    console.error(`❌ [PIX] Erro crítico ao gerar PIX:`, error);
    throw error;
  }
}

// Main handler function
async function handleRequest(req: Request) {
  try {
    const supabase = createSupabaseClient();
    
    const requestData = await req.json();
    const { 
      pedido_id: pedidoId, 
      total_amount: totalAmount,
      payment_method = 'pix',
      user_email: userEmail
    } = requestData;
    
    console.log("[PROCESS-PAYMENT] Processando pagamento PIX:", { 
      pedidoId, 
      totalAmount, 
      paymentMethod: payment_method,
      userEmail
    });
    
    // Validações
    validatePedidoId(pedidoId);
    
    if (!totalAmount || totalAmount <= 0) {
      throw new Error(`Valor total inválido: ${totalAmount}`);
    }

    if (payment_method !== 'pix') {
      throw new Error(`Método de pagamento inválido: ${payment_method}. Apenas PIX está disponível.`);
    }
    
    // Verificar se o pedido existe
    const { data: existingPedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('id, status, valor_total')
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !existingPedido) {
      throw new Error(`Pedido não encontrado: ${pedidoId}`);
    }

    if (existingPedido.status === 'pago' || existingPedido.status === 'pago_pendente_video') {
      console.log(`⚠️ [PIX] Pedido ${pedidoId} já foi pago`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Pedido já foi pago",
          pedido_id: pedidoId,
          status: existingPedido.status
        }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        }
      );
    }
    
    // Processar PIX
    const pixResult = await generatePixPayment(supabase, pedidoId, totalAmount, userEmail || 'cliente@exemplo.com');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "PIX gerado com sucesso",
        pixData: pixResult.pixData,
        pedido_id: pedidoId,
        payment_method: 'pix',
        valor_original: totalAmount,
        valor_pix: pixResult.pixData.valor_pix,
        qr_code_base64: pixResult.pixData.qrCodeBase64,
        qr_code_text: pixResult.pixData.qrCode,
        expires_at: pixResult.pixData.expires_at
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
    
  } catch (error: any) {
    console.error('[PROCESS-PAYMENT] Erro ao processar pagamento PIX:', error);
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

// Handle CORS preflight requests
function handleCorsPreflightRequest() {
  return new Response(null, { headers: corsHeaders });
}

// Main serve handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }
  
  return handleRequest(req);
});
