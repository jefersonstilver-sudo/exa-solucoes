// Payment Processing - Provider Agnostic
// Version: 6.0.0 - Mercado Pago REMOVED - Migrating to Inter/Asaas
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Payment provider configuration
const PAYMENT_PROVIDER = Deno.env.get('PAYMENT_PROVIDER') || 'none'; // Options: 'inter', 'asaas', 'none'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 5 payment attempts per minute per IP
  const clientId = getClientIdentifier(req);
  const rateLimitResult = checkRateLimit(clientId, {
    maxAttempts: 5,
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000 // 5 minutes block
  });

  if (!rateLimitResult.allowed) {
    console.warn(`🚫 [PAYMENT] Rate limit exceeded for ${clientId}`);
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  try {
    const body = await req.json();
    // Accept both camelCase (pedidoId) and snake_case (pedido_id) for compatibility
    const pedido_id = body.pedido_id || body.pedidoId;
    const { payment_method, total_amount, create_preference } = body;
    
    console.log('🎯 [PAYMENT] Iniciando processamento:', { pedido_id, payment_method, create_preference, provider: PAYMENT_PROVIDER });
    
    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (!pedido_id) {
      throw new Error('pedido_id é obrigatório');
    }

    // Buscar dados do pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedido_id)
      .single();

    if (pedidoError || !pedido) {
      console.error('❌ [PAYMENT] Pedido não encontrado:', pedidoError);
      throw new Error('Pedido não encontrado');
    }

    console.log(`✅ [PAYMENT] Pedido encontrado. Valor: R$ ${pedido.valor_total}`);

    // ============================================================
    // PAYMENT PROVIDER ROUTING
    // ============================================================
    
    // Check if a valid provider is configured
    if (PAYMENT_PROVIDER === 'none' || !PAYMENT_PROVIDER) {
      console.error('❌ [PAYMENT] Nenhum provedor de pagamento configurado');
      
      // Log the attempt for tracking
      await supabase
        .from('log_eventos_sistema')
        .insert({
          tipo_evento: 'payment_provider_not_configured',
          descricao: `Tentativa de pagamento sem provedor configurado`,
          detalhes: {
            pedido_id,
            payment_method,
            valor: pedido.valor_total,
            timestamp: new Date().toISOString()
          }
        });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
          message: 'Provedor de pagamento não configurado. Aguarde a configuração do novo sistema de pagamentos (Inter/Asaas).',
          support_message: 'Entre em contato com o suporte para mais informações sobre formas de pagamento disponíveis.'
        }),
        { 
          status: 503, // Service Unavailable
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // ============================================================
    // BANCO INTER INTEGRATION (Future)
    // ============================================================
    if (PAYMENT_PROVIDER === 'inter') {
      console.log('🏦 [PAYMENT] Processando via Banco Inter...');
      
      // Check for Inter credentials
      const interClientId = Deno.env.get('INTER_CLIENT_ID');
      const interClientSecret = Deno.env.get('INTER_CLIENT_SECRET');
      const interCertificate = Deno.env.get('INTER_CERTIFICATE');
      
      if (!interClientId || !interClientSecret || !interCertificate) {
        console.error('❌ [PAYMENT] Credenciais do Banco Inter não configuradas');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'INTER_CREDENTIALS_MISSING',
            message: 'Credenciais do Banco Inter não configuradas. Configure INTER_CLIENT_ID, INTER_CLIENT_SECRET e INTER_CERTIFICATE.'
          }),
          { 
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // TODO: Implement Banco Inter PIX/Boleto generation
      // Reference: https://developers.inter.co/
      // This will use OAuth2 + mTLS for authentication
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INTER_NOT_IMPLEMENTED',
          message: 'Integração com Banco Inter em desenvolvimento. Use pagamento manual por enquanto.'
        }),
        { 
          status: 501, // Not Implemented
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // ============================================================
    // ASAAS INTEGRATION (Future)
    // ============================================================
    if (PAYMENT_PROVIDER === 'asaas') {
      console.log('💳 [PAYMENT] Processando via Asaas...');
      
      const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
      
      if (!asaasApiKey) {
        console.error('❌ [PAYMENT] Credenciais do Asaas não configuradas');
        return new Response(
          JSON.stringify({
            success: false,
            error: 'ASAAS_CREDENTIALS_MISSING',
            message: 'API Key do Asaas não configurada. Configure ASAAS_API_KEY.'
          }),
          { 
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // TODO: Implement Asaas PIX/Boleto/Credit Card generation
      // Reference: https://docs.asaas.com/
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ASAAS_NOT_IMPLEMENTED',
          message: 'Integração com Asaas em desenvolvimento. Use pagamento manual por enquanto.'
        }),
        { 
          status: 501, // Not Implemented
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Unknown provider
    console.error(`❌ [PAYMENT] Provedor desconhecido: ${PAYMENT_PROVIDER}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'UNKNOWN_PAYMENT_PROVIDER',
        message: `Provedor de pagamento desconhecido: ${PAYMENT_PROVIDER}. Valores válidos: 'inter', 'asaas'.`
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ [PAYMENT] Erro:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
