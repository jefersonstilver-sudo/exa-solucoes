
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-key',
};

// Chave de validação do webhook - OBRIGATÓRIA
const WEBHOOK_VALIDATION_KEY = "fd56e44c5135cea21520f535e882abcfd1000b2901f0d9d4868ddf2ade5021ed";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  console.log("🔔 WEBHOOK MERCADOPAGO ENHANCED: Requisição recebida", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  try {
    // Verificar se é uma requisição POST
    if (req.method !== 'POST') {
      console.log("❌ WEBHOOK: Método não permitido:", req.method);
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Validar chave de webhook
    const webhookKey = req.headers.get('x-webhook-key');
    
    if (webhookKey !== WEBHOOK_VALIDATION_KEY) {
      console.log("❌ WEBHOOK: Chave de validação inválida:", webhookKey);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid webhook key' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log("✅ WEBHOOK: Chave de validação aprovada");

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter dados do pagamento
    const paymentData = await req.json();
    
    console.log("🔄 WEBHOOK ENHANCED: Dados do pagamento recebidos:", JSON.stringify(paymentData, null, 2));

    // Log do webhook recebido
    await supabase
      .from('webhook_logs')
      .insert({
        origem: 'mercadopago_webhook_enhanced',
        status: 'received',
        payload: paymentData
      });

    // Extrair dados importantes
    const paymentId = paymentData?.data?.id || paymentData?.id;
    const status = paymentData?.action || paymentData?.type;
    
    console.log("📦 WEBHOOK ENHANCED: Dados extraídos:", { paymentId, status });

    // Se for uma notificação de pagamento aprovado
    if (status === 'payment.updated' || status === 'payment.created') {
      console.log("💰 WEBHOOK ENHANCED: Processando notificação de pagamento");
      
      // Buscar detalhes do pagamento via API do MercadoPago
      const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
      
      if (mpAccessToken && paymentId) {
        console.log("🔍 WEBHOOK ENHANCED: Buscando detalhes completos do pagamento:", paymentId);
        
        const paymentDetailsResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          {
            headers: {
              'Authorization': `Bearer ${mpAccessToken}`
            }
          }
        );
        
        if (paymentDetailsResponse.ok) {
          const paymentDetails = await paymentDetailsResponse.json();
          
          console.log("💳 WEBHOOK ENHANCED: Detalhes completos do pagamento:", {
            id: paymentDetails.id,
            status: paymentDetails.status,
            external_reference: paymentDetails.external_reference,
            transaction_amount: paymentDetails.transaction_amount,
            payment_method_id: paymentDetails.payment_method_id,
            payer: paymentDetails.payer ? {
              email: paymentDetails.payer.email,
              identification: paymentDetails.payer.identification
            } : null,
            transaction_details: paymentDetails.transaction_details
          });
          
          // Se o pagamento foi aprovado
          if (paymentDetails.status === 'approved' && paymentDetails.external_reference) {
            console.log("🎉 WEBHOOK ENHANCED: Pagamento aprovado! Processando com dados de compliance...");
            
            // Processar pagamento aprovado com função aprimorada
            const { data: result, error } = await supabase.rpc(
              'process_mercadopago_webhook_enhanced',
              { p_payment_data: paymentDetails }
            );
            
            if (error) {
              console.error("❌ WEBHOOK ENHANCED: Erro ao processar pagamento:", error);
              throw error;
            }
            
            console.log("✅ WEBHOOK ENHANCED: Pagamento processado com dados de compliance:", result);
            
            // Log de sucesso
            await supabase
              .from('webhook_logs')
              .insert({
                origem: 'mercadopago_payment_approved_enhanced',
                status: 'success',
                payload: {
                  payment_id: paymentDetails.id,
                  external_reference: paymentDetails.external_reference,
                  amount: paymentDetails.transaction_amount,
                  compliance_captured: true,
                  processed_result: result
                }
              });
            
            return new Response(
              JSON.stringify({
                success: true,
                message: 'Pagamento aprovado processado com dados de compliance',
                payment_id: paymentDetails.id,
                pedido_id: result?.pedido_id,
                compliance_data_captured: result?.compliance_data_captured
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
              }
            );
          } else {
            console.log("ℹ️ WEBHOOK ENHANCED: Pagamento não aprovado ainda:", paymentDetails.status);
          }
        } else {
          console.error("❌ WEBHOOK ENHANCED: Erro ao buscar detalhes do pagamento:", paymentDetailsResponse.status);
        }
      }
    }

    // Resposta padrão para outros tipos de webhook
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook enhanced recebido e processado',
        status: status
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("💥 WEBHOOK ENHANCED: Erro crítico:", error);
    
    // Log do erro
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('webhook_logs')
        .insert({
          origem: 'mercadopago_webhook_enhanced_error',
          status: 'error',
          payload: {
            error: error.message,
            stack: error.stack
          }
        });
    } catch (logError) {
      console.error("Erro ao salvar log:", logError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor',
        message: 'Falha ao processar webhook enhanced'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
