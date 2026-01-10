/**
 * Edge Function: process-payment
 * 
 * Processamento de pagamentos via Asaas
 * Suporta PIX, Boleto e Cartão de Crédito
 * 
 * @version 8.0.0 - Migração para Asaas
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rate-limiter.ts';
import { createPixCharge } from '../_shared/asaas-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    console.log('🎯 [PAYMENT] Iniciando processamento via Asaas:', { pedido_id, payment_method });
    
    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (!pedido_id) {
      throw new Error('pedido_id é obrigatório');
    }

    // Verificar se Asaas está configurado
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      console.error('❌ [PAYMENT] ASAAS_API_KEY não configurada');
      
      await supabase
        .from('log_eventos_sistema')
        .insert({
          tipo_evento: 'payment_provider_not_configured',
          descricao: 'ASAAS_API_KEY não configurada',
          detalhes: {
            pedido_id,
            payment_method,
            timestamp: new Date().toISOString()
          }
        });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'ASAAS_CREDENTIALS_MISSING',
          message: 'API Key do Asaas não configurada. Configure ASAAS_API_KEY nas secrets.',
          support_message: 'Entre em contato com o suporte para configurar o sistema de pagamentos.'
        }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Buscar dados do pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*, users:client_id(nome, email, cpf, empresa_documento, telefone)')
      .eq('id', pedido_id)
      .single();

    if (pedidoError || !pedido) {
      console.error('❌ [PAYMENT] Pedido não encontrado:', pedidoError);
      throw new Error('Pedido não encontrado');
    }

    const valorPedido = total_amount || pedido.valor_total;
    console.log(`✅ [PAYMENT] Pedido encontrado. Valor: R$ ${valorPedido}`);

    // ============================================================
    // PIX PAYMENT VIA ASAAS
    // ============================================================
    if (payment_method === 'pix') {
      console.log('📱 [PAYMENT] Gerando PIX via Asaas...');
      
      try {
        // Preparar dados do cliente
        const user = pedido.users;
        const cpfCnpj = (user?.cpf || user?.empresa_documento)?.replace(/\D/g, '');
        
        const customerData = {
          name: user?.nome || 'Cliente EXA',
          email: user?.email || undefined,
          cpfCnpj: cpfCnpj || undefined,
          mobilePhone: user?.telefone?.replace(/\D/g, '') || undefined,
        };
        
        console.log('👤 [PAYMENT] Dados do cliente:', { 
          name: customerData.name,
          hasEmail: !!customerData.email,
          hasCpfCnpj: !!customerData.cpfCnpj
        });
        
        // Criar cobrança PIX
        const pixResult = await createPixCharge(
          customerData,
          valorPedido,
          `Pedido EXA #${pedido_id.substring(0, 8)}`,
          pedido_id // external reference
        );
        
        console.log('✅ [PAYMENT] PIX gerado com sucesso:', {
          paymentId: pixResult.paymentId,
          hasQrCode: !!pixResult.qrCodeBase64,
          expiresAt: pixResult.expiresAt
        });
        
        // Log do evento
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'payment_pix_created_asaas',
            descricao: 'PIX gerado via Asaas',
            detalhes: {
              pedido_id,
              asaas_payment_id: pixResult.paymentId,
              valor: valorPedido,
              status: pixResult.status,
              expires_at: pixResult.expiresAt,
              timestamp: new Date().toISOString()
            }
          });
        
        // Atualizar pedido com dados do PIX
        await supabase
          .from('pedidos')
          .update({
            status: 'aguardando_pagamento',
            metodo_pagamento: 'pix_asaas',
            asaas_payment_id: pixResult.paymentId,
            updated_at: new Date().toISOString()
          })
          .eq('id', pedido_id);
        
        // Retornar resposta compatível com PixQrCodeDialog
        return new Response(
          JSON.stringify({
            success: true,
            provider: 'asaas',
            paymentId: pixResult.paymentId,
            status: pixResult.status,
            qrCodeBase64: pixResult.qrCodeBase64,
            qrCode: pixResult.pixCopiaECola,
            pixCopiaECola: pixResult.pixCopiaECola,
            pedidoId: pedido_id,
            valor: valorPedido,
            expiresAt: pixResult.expiresAt,
            invoiceUrl: pixResult.invoiceUrl
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
        
      } catch (asaasError: any) {
        console.error('❌ [PAYMENT] Erro na API do Asaas:', asaasError);
        
        // Log do erro
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'payment_asaas_error',
            descricao: 'Erro ao gerar PIX via Asaas',
            detalhes: {
              pedido_id,
              error: asaasError.message,
              stack: asaasError.stack,
              timestamp: new Date().toISOString()
            }
          });
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'ASAAS_API_ERROR',
            message: `Erro ao processar pagamento PIX: ${asaasError.message}`,
            support_message: 'Tente novamente em alguns minutos ou entre em contato com o suporte.'
          }),
          { 
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    // ============================================================
    // BOLETO PAYMENT VIA ASAAS (Future)
    // ============================================================
    if (payment_method === 'boleto') {
      console.log('📄 [PAYMENT] Boleto via Asaas - Em desenvolvimento');
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'BOLETO_NOT_IMPLEMENTED',
          message: 'Pagamento por boleto será implementado em breve. Use PIX por enquanto.'
        }),
        { 
          status: 501,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Unknown payment method
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
