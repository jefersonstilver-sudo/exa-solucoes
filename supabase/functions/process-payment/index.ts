// Payment Processing - Banco Inter Integration
// Version: 7.0.0 - Banco Inter PIX Implementation
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rate-limiter.ts';
import { 
  generateTxId, 
  formatInterValue, 
  createPixCobranca, 
  getPixQrCode,
  InterPixCobrancaRequest 
} from '../_shared/inter-client.ts';

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
    const { payment_method, total_amount } = body;
    
    console.log('🎯 [PAYMENT] Iniciando processamento:', { pedido_id, payment_method, provider: PAYMENT_PROVIDER });
    
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
      .select('*, users:client_id(nome, email, cpf, empresa_documento)')
      .eq('id', pedido_id)
      .single();

    if (pedidoError || !pedido) {
      console.error('❌ [PAYMENT] Pedido não encontrado:', pedidoError);
      throw new Error('Pedido não encontrado');
    }

    const valorPedido = total_amount || pedido.valor_total;
    console.log(`✅ [PAYMENT] Pedido encontrado. Valor: R$ ${valorPedido}`);

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
            valor: valorPedido,
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
    // BANCO INTER INTEGRATION
    // ============================================================
    if (PAYMENT_PROVIDER === 'inter') {
      console.log('🏦 [PAYMENT] Processando via Banco Inter...');
      
      // Check for Inter credentials (correct names matching inter-client.ts)
      const interClientId = Deno.env.get('INTER_CLIENT_ID');
      const interClientSecret = Deno.env.get('INTER_CLIENT_SECRET');
      const interCertificateBase64 = Deno.env.get('INTER_CERTIFICATE_BASE64');
      const interPrivateKeyBase64 = Deno.env.get('INTER_PRIVATE_KEY_BASE64');
      const interPixKey = Deno.env.get('INTER_PIX_KEY');
      
      if (!interClientId || !interClientSecret || !interCertificateBase64 || !interPrivateKeyBase64 || !interPixKey) {
        console.error('❌ [PAYMENT] Credenciais do Banco Inter não configuradas');
        
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'inter_credentials_missing',
            descricao: `Credenciais do Banco Inter incompletas`,
            detalhes: {
              pedido_id,
              has_client_id: !!interClientId,
              has_client_secret: !!interClientSecret,
              has_certificate: !!interCertificateBase64,
              has_private_key: !!interPrivateKeyBase64,
              has_pix_key: !!interPixKey,
              timestamp: new Date().toISOString()
            }
          });
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'INTER_CREDENTIALS_MISSING',
            message: 'Credenciais do Banco Inter não configuradas. Configure INTER_CLIENT_ID, INTER_CLIENT_SECRET, INTER_CERTIFICATE_BASE64, INTER_PRIVATE_KEY_BASE64 e INTER_PIX_KEY.'
          }),
          { 
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // ============================================================
      // PIX PAYMENT VIA BANCO INTER
      // ============================================================
      if (payment_method === 'pix') {
        console.log('📱 [PAYMENT] Gerando PIX via Banco Inter...');
        
        try {
          // Generate unique TXID
          const txid = generateTxId();
          console.log(`🔑 [PAYMENT] TXID gerado: ${txid}`);
          
          // Build cobrança request
          const cobrancaRequest: InterPixCobrancaRequest = {
            calendario: {
              expiracao: 3600 // 1 hour expiration
            },
            valor: {
              original: formatInterValue(valorPedido)
            },
            chave: interPixKey,
            solicitacaoPagador: `Pedido EXA #${pedido_id.substring(0, 8)}`,
            infoAdicionais: [
              { nome: 'Pedido', valor: pedido_id },
              { nome: 'Sistema', valor: 'EXA Midia' }
            ]
          };
          
          // Add devedor info if available
          if (pedido.users) {
            const user = pedido.users;
            // Use cpf for individuals or empresa_documento for companies
            const cpfCnpj = (user.cpf || user.empresa_documento)?.replace(/\D/g, '');
            
            if (cpfCnpj) {
              cobrancaRequest.devedor = {
                nome: user.nome || 'Cliente EXA',
                ...(cpfCnpj.length === 11 ? { cpf: cpfCnpj } : { cnpj: cpfCnpj })
              };
            }
          }
          
          console.log('📤 [PAYMENT] Criando cobrança PIX no Inter...');
          
          // Create PIX cobrança
          const cobranca = await createPixCobranca(txid, cobrancaRequest);
          
          console.log(`✅ [PAYMENT] Cobrança criada. Status: ${cobranca.status}, Loc ID: ${cobranca.loc.id}`);
          
          // Get QR Code
          const qrCodeData = await getPixQrCode(cobranca.loc.id);
          
          console.log('✅ [PAYMENT] QR Code gerado com sucesso');
          
          // Log the successful payment creation
          await supabase
            .from('log_eventos_sistema')
            .insert({
              tipo_evento: 'payment_pix_created_inter',
              descricao: `PIX gerado via Banco Inter`,
              detalhes: {
                pedido_id,
                txid,
                loc_id: cobranca.loc.id,
                valor: valorPedido,
                status: cobranca.status,
                expiracao: cobranca.calendario.expiracao,
                timestamp: new Date().toISOString()
              }
            });
          
          // Update pedido with PIX info
          await supabase
            .from('pedidos')
            .update({
              status: 'aguardando_pagamento',
              metodo_pagamento: 'pix_inter',
              updated_at: new Date().toISOString()
            })
            .eq('id', pedido_id);
          
          // Return response compatible with PixQrCodeDialog
          return new Response(
            JSON.stringify({
              success: true,
              provider: 'inter',
              txid,
              locId: cobranca.loc.id,
              status: cobranca.status,
              qrCodeBase64: qrCodeData.imagemQrcode, // Already base64 from Inter
              qrCode: qrCodeData.qrcode, // EMV / copia e cola
              pixCopiaECola: cobranca.pixCopiaECola || qrCodeData.qrcode,
              pedidoId: pedido_id,
              valor: valorPedido,
              expiracao: cobranca.calendario.expiracao
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
          
        } catch (interError: any) {
          console.error('❌ [PAYMENT] Erro na API do Banco Inter:', interError);
          
          // Log the error
          await supabase
            .from('log_eventos_sistema')
            .insert({
              tipo_evento: 'payment_inter_error',
              descricao: `Erro ao gerar PIX via Banco Inter`,
              detalhes: {
                pedido_id,
                error: interError.message,
                stack: interError.stack,
                timestamp: new Date().toISOString()
              }
            });
          
          return new Response(
            JSON.stringify({
              success: false,
              error: 'INTER_API_ERROR',
              message: `Erro ao processar pagamento PIX: ${interError.message}`,
              support_message: 'Tente novamente em alguns minutos ou entre em contato com o suporte.'
            }),
            { 
              status: 502, // Bad Gateway (upstream error)
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
      
      // ============================================================
      // BOLETO PAYMENT VIA BANCO INTER (Future)
      // ============================================================
      if (payment_method === 'boleto') {
        console.log('📄 [PAYMENT] Boleto via Banco Inter - Em desenvolvimento');
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'BOLETO_NOT_IMPLEMENTED',
            message: 'Pagamento por boleto será implementado em breve. Use PIX por enquanto.'
          }),
          { 
            status: 501, // Not Implemented
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Unknown payment method for Inter
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_PAYMENT_METHOD',
          message: `Método de pagamento '${payment_method}' não suportado. Use 'pix' ou 'boleto'.`
        }),
        { 
          status: 400,
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
