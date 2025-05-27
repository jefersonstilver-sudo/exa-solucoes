
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  try {
    // Verificar se é uma requisição POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido' }),
        {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Validar chave de webhook
    const authHeader = req.headers.get('authorization');
    const webhookKey = req.headers.get('x-webhook-key');
    
    if (webhookKey !== WEBHOOK_VALIDATION_KEY) {
      console.log("❌ WEBHOOK: Chave de validação inválida");
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
    
    console.log("🔄 WEBHOOK: Dados do pagamento recebidos:", JSON.stringify(paymentData, null, 2));

    // Processar webhook com a nova função que faz limpeza imediata
    const { data: result, error } = await supabase.rpc(
      'process_mercadopago_webhook_with_cleanup',
      { p_payment_data: paymentData }
    );

    if (error) {
      console.error("❌ WEBHOOK: Erro ao processar:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          message: 'Erro interno ao processar webhook'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log("✅ WEBHOOK: Processamento concluído:", result);

    // Se o pagamento foi aprovado e processado com sucesso
    if (result?.success && result?.pedido_id) {
      console.log(`🎉 WEBHOOK: Pagamento aprovado! Pedido criado: ${result.pedido_id}`);
      
      // Executar limpeza automática adicional
      const { data: cleanupResult } = await supabase.rpc('auto_cleanup_paid_attempts');
      console.log("🧹 WEBHOOK: Limpeza automática executada:", cleanupResult);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processado com sucesso',
        result: result
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("💥 WEBHOOK: Erro crítico:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor',
        message: 'Falha ao processar webhook'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
