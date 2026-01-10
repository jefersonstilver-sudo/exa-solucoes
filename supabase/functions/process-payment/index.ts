/**
 * Edge Function: process-payment
 * 
 * Processamento de pagamentos via Asaas
 * Suporta PIX avulso e Assinaturas Recorrentes
 * 
 * @version 9.0.0 - Suporte a Assinaturas Recorrentes
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rate-limiter.ts';
import { createPixCharge, createPixSubscription, createPixAutomaticoCharge } from '../_shared/asaas-client.ts';

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
    const planoMeses = pedido.plano_meses || 1;
    const isAssinatura = planoMeses > 1;
    
    console.log(`✅ [PAYMENT] Pedido encontrado. Valor: R$ ${valorPedido}, Plano: ${planoMeses} meses, Assinatura: ${isAssinatura}`);

    // ============================================================
    // PIX PAYMENT VIA ASAAS
    // ============================================================
    if (payment_method === 'pix') {
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
        
        // ============================================================
        // PIX AUTOMÁTICO (plano > 1 mês)
        // Débito recorrente com autorização no app do banco
        // ============================================================
        if (isAssinatura) {
          console.log('📅 [PAYMENT] Criando PIX com parcelamento:', { planoMeses });
          
          const valorMensal = Math.round((valorPedido / planoMeses) * 100) / 100;
          
          try {
            // Tentar criar PIX Automático com débito recorrente
            const pixResult = await createPixAutomaticoCharge(
              customerData,
              valorMensal,
              planoMeses,
              `Assinatura EXA #${pedido_id.substring(0, 8)} - ${planoMeses}x R$ ${valorMensal.toFixed(2)}`,
              pedido_id
            );
            
            console.log('✅ [PAYMENT] PIX Automático criado:', {
              qrCodeId: pixResult.qrCodeId,
              valorMensal,
              planoMeses,
              isPixAutomatico: pixResult.isPixAutomatico
            });
            
            // Log do evento
            await supabase
              .from('log_eventos_sistema')
              .insert({
                tipo_evento: 'payment_pix_automatico_created',
                descricao: `PIX Automático criado - ${planoMeses}x R$ ${valorMensal.toFixed(2)}`,
                detalhes: {
                  pedido_id,
                  qr_code_id: pixResult.qrCodeId,
                  valor_mensal: valorMensal,
                  valor_total: valorPedido,
                  plano_meses: planoMeses,
                  is_pix_automatico: true,
                  expires_at: pixResult.expiresAt,
                  timestamp: new Date().toISOString()
                }
              });
            
            // Atualizar pedido com info de PIX Automático
            await supabase
              .from('pedidos')
              .update({
                status: 'aguardando_pagamento',
                metodo_pagamento: 'pix_parcelado',
                is_subscription: true,
                transaction_id: pixResult.qrCodeId,
                updated_at: new Date().toISOString()
              })
              .eq('id', pedido_id);
            
            // Calcular data fim
            const dataFim = new Date();
            dataFim.setMonth(dataFim.getMonth() + planoMeses);
            
            // Criar registro na tabela assinaturas
            await supabase
              .from('assinaturas')
              .insert({
                pedido_id,
                client_id: pedido.client_id,
                tipo: 'pix_parcelado',
                status: 'pendente',
                valor_mensal: valorMensal,
                metodo_pagamento: 'pix',
                data_inicio: new Date().toISOString().split('T')[0],
                data_fim: dataFim.toISOString().split('T')[0],
                recorrencia: 'mensal'
              });
            
            // Retornar resposta com info de PIX parcelado
            return new Response(
              JSON.stringify({
                success: true,
                provider: 'asaas',
                isSubscription: true,
                isPixParcelado: true,
                paymentId: pixResult.qrCodeId,
                status: pixResult.status,
                qrCodeBase64: pixResult.qrCodeBase64,
                qrCode: pixResult.pixCopiaECola,
                pixCopiaECola: pixResult.pixCopiaECola,
                pedidoId: pedido_id,
                valor: valorMensal,
                valorTotal: valorPedido,
                totalMeses: planoMeses,
                expiresAt: pixResult.expiresAt,
                // Mensagem informativa para o cliente
                infoMessage: `Após o primeiro pagamento de R$ ${valorMensal.toFixed(2)}, você receberá os próximos ${planoMeses - 1} PIX mensalmente por email.`
              }),
              { 
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
            
          } catch (pixAutoError: any) {
            // Se falhar o PIX Automático, tentar subscription tradicional como fallback
            console.warn('⚠️ [PAYMENT] PIX Automático falhou, usando subscription tradicional:', pixAutoError.message);
            
            const subscriptionResult = await createPixSubscription(
              customerData,
              valorMensal,
              planoMeses,
              `Assinatura EXA #${pedido_id.substring(0, 8)} - ${planoMeses} meses`,
              pedido_id
            );
            
            console.log('✅ [PAYMENT] Assinatura PIX criada (fallback):', {
              subscriptionId: subscriptionResult.subscriptionId,
              paymentId: subscriptionResult.firstPaymentId
            });
            
            // Log do evento
            await supabase
              .from('log_eventos_sistema')
              .insert({
                tipo_evento: 'payment_subscription_created_asaas',
                descricao: `Assinatura PIX criada (fallback) - ${planoMeses} meses`,
                detalhes: {
                  pedido_id,
                  asaas_subscription_id: subscriptionResult.subscriptionId,
                  asaas_payment_id: subscriptionResult.firstPaymentId,
                  valor_mensal: valorMensal,
                  valor_total: valorPedido,
                  plano_meses: planoMeses,
                  fallback_reason: pixAutoError.message,
                  timestamp: new Date().toISOString()
                }
              });
            
            // Atualizar pedido como assinatura
            await supabase
              .from('pedidos')
              .update({
                status: 'aguardando_pagamento',
                metodo_pagamento: 'pix_assinatura',
                is_subscription: true,
                asaas_subscription_id: subscriptionResult.subscriptionId,
                transaction_id: subscriptionResult.firstPaymentId,
                updated_at: new Date().toISOString()
              })
              .eq('id', pedido_id);
            
            // Calcular data fim
            const dataFim = new Date();
            dataFim.setMonth(dataFim.getMonth() + planoMeses);
            
            // Criar registro na tabela assinaturas
            await supabase
              .from('assinaturas')
              .insert({
                pedido_id,
                client_id: pedido.client_id,
                tipo: 'recorrente_pix',
                status: 'pendente',
                valor_mensal: valorMensal,
                metodo_pagamento: 'pix',
                data_inicio: new Date().toISOString().split('T')[0],
                data_fim: dataFim.toISOString().split('T')[0],
                recorrencia: 'mensal'
              });
            
            return new Response(
              JSON.stringify({
                success: true,
                provider: 'asaas',
                isSubscription: true,
                subscriptionId: subscriptionResult.subscriptionId,
                paymentId: subscriptionResult.firstPaymentId,
                status: subscriptionResult.status,
                qrCodeBase64: subscriptionResult.qrCodeBase64,
                qrCode: subscriptionResult.pixCopiaECola,
                pixCopiaECola: subscriptionResult.pixCopiaECola,
                pedidoId: pedido_id,
                valor: valorMensal,
                valorTotal: valorPedido,
                totalMeses: planoMeses,
                expiresAt: subscriptionResult.expiresAt,
                invoiceUrl: subscriptionResult.invoiceUrl,
                infoMessage: `Primeira parcela de R$ ${valorMensal.toFixed(2)}. Você receberá os próximos PIX mensalmente.`
              }),
              { 
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        }
        
        // ============================================================
        // PIX AVULSO (plano 1 mês)
        // ============================================================
        console.log('📱 [PAYMENT] Gerando PIX avulso via Asaas...');
        
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
            transaction_id: pixResult.paymentId,
            updated_at: new Date().toISOString()
          })
          .eq('id', pedido_id);
        
        // Retornar resposta compatível com PixQrCodeDialog
        return new Response(
          JSON.stringify({
            success: true,
            provider: 'asaas',
            isSubscription: false,
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
