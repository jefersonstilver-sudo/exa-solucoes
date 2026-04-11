/**
 * Edge Function: asaas-webhook
 * 
 * Webhook para receber notificações de pagamento do Asaas
 * Processa eventos de pagamento confirmado/recebido
 * 
 * URL: https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/asaas-webhook
 * 
 * Documentação: https://docs.asaas.com/reference/webhooks
 * 
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

// ========================================
// TIPOS DO WEBHOOK ASAAS
// ========================================

interface AsaasWebhookPayment {
  id: string;
  customer: string;
  value: number;
  netValue: number;
  billingType: string;
  status: string;
  dueDate: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  confirmedDate?: string;
  externalReference?: string;
  description?: string;
  invoiceUrl?: string;
  transactionReceiptUrl?: string;
  subscription?: string; // ID da assinatura, se for pagamento de assinatura
}

interface AsaasWebhookEvent {
  id: string;
  event: string;
  payment?: AsaasWebhookPayment;
  dateCreated?: string;
}

// Status de pagamento confirmado/recebido
const PAYMENT_CONFIRMED_EVENTS = [
  'PAYMENT_RECEIVED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED_IN_CASH_UNDONE',
];

// Eventos de PIX Automático (Débito Recorrente)
const DIRECT_AUTHORIZATION_EVENTS = [
  'DIRECT_AUTHORIZATION_CREATED',      // Cliente autorizou débito automático
  'DIRECT_AUTHORIZATION_REJECTED',     // Cliente rejeitou autorização
  'DIRECT_AUTHORIZATION_PAYMENT_RECEIVED', // Parcela debitada automaticamente
  'DIRECT_AUTHORIZATION_PAYMENT_FAILED',   // Falha no débito automático
  'DIRECT_AUTHORIZATION_CANCELLED',    // Autorização cancelada
];

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    service: 'asaas-webhook',
    message,
    ...data
  };
  
  if (level === 'error') {
    console.error(JSON.stringify(logEntry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * Valida a estrutura do webhook do Asaas
 * O Asaas não envia token separado - validamos pela estrutura do payload
 */
function validateWebhookPayload(payload: any): boolean {
  // Verificar se tem a estrutura básica do webhook Asaas
  if (!payload || typeof payload !== 'object') {
    log('warn', 'Payload inválido - não é um objeto');
    return false;
  }
  
  // Webhooks do Asaas sempre têm 'event' e podem ter 'payment' ou 'subscription'
  if (!payload.event || typeof payload.event !== 'string') {
    log('warn', 'Payload sem campo event válido');
    return false;
  }
  
  // Se for evento de pagamento, deve ter objeto payment
  if (payload.event.startsWith('PAYMENT_') && !payload.payment) {
    log('warn', 'Evento de pagamento sem objeto payment');
    return false;
  }
  
  return true;
}

// ========================================
// HANDLER PRINCIPAL
// ========================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Apenas POST é aceito
  if (req.method !== 'POST') {
    log('warn', 'Método não permitido', { method: req.method });
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse do body
    const body = await req.text();
    log('info', '📥 Webhook Asaas recebido', { bodyLength: body.length });
    
    let event: AsaasWebhookEvent;
    try {
      event = JSON.parse(body);
    } catch (parseError) {
      log('error', 'Erro ao parsear JSON do webhook', { error: parseError.message, body: body.substring(0, 500) });
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar estrutura do payload Asaas
    if (!validateWebhookPayload(event)) {
      log('error', 'Estrutura do webhook inválida');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook structure' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log('info', '🎯 Evento recebido', { 
      eventId: event.id,
      eventType: event.event,
      paymentId: event.payment?.id,
      externalReference: event.payment?.externalReference,
      status: event.payment?.status
    });

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar idempotência - evitar processar o mesmo evento duas vezes
    const { data: existingLog } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('webhook_id', event.id)
      .eq('provider', 'asaas')
      .maybeSingle();

    if (existingLog) {
      log('info', '⚠️ Evento já processado (idempotência)', { eventId: event.id });
      return new Response(
        JSON.stringify({ success: true, message: 'Event already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Registrar log do webhook (antes de processar para garantir idempotência)
    await supabase
      .from('webhook_logs')
      .insert({
        provider: 'asaas',
        webhook_id: event.id,
        event_type: event.event,
        payload: event,
        status: 'received',
        created_at: new Date().toISOString()
      });

    // ========================================
    // PROCESSAR EVENTOS DE PAGAMENTO
    // ========================================
    
    if (PAYMENT_CONFIRMED_EVENTS.includes(event.event) && event.payment) {
      log('info', '💰 Processando pagamento confirmado', {
        paymentId: event.payment.id,
        value: event.payment.value,
        status: event.payment.status,
        subscription: event.payment.subscription
      });

      const payment = event.payment;
      const pedidoId = payment.externalReference;
      const isSubscriptionPayment = !!payment.subscription;

      if (!pedidoId) {
        log('warn', '⚠️ Pagamento sem external_reference (pedido_id)', { paymentId: payment.id });
        
        // Atualizar log com erro
        await supabase
          .from('webhook_logs')
          .update({ 
            status: 'error',
            error_message: 'Pagamento sem external_reference',
            processed_at: new Date().toISOString()
          })
          .eq('webhook_id', event.id)
          .eq('provider', 'asaas');

        return new Response(
          JSON.stringify({ success: true, message: 'Payment without order reference' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar pedido pelo ID - primeiro tenta na tabela pedidos
      let { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('id, status, client_id, valor_total, is_subscription, asaas_subscription_id')
        .eq('id', pedidoId)
        .maybeSingle();

      // Se não encontrar pedido, verificar se o external_reference é um ID de PARCELA
      let parcelaEncontrada = null;
      if (!pedido) {
        log('info', '🔍 Pedido não encontrado, buscando na tabela parcelas...', { externalReference: pedidoId });
        
        const { data: parcela, error: parcelaError } = await supabase
          .from('parcelas')
          .select('id, pedido_id, numero_parcela, valor_final, status')
          .eq('id', pedidoId)
          .maybeSingle();
        
        if (parcela && parcela.pedido_id) {
          log('info', '✅ PARCELA encontrada! Buscando pedido associado...', { 
            parcelaId: parcela.id, 
            pedidoIdReal: parcela.pedido_id,
            numeroParcela: parcela.numero_parcela 
          });
          
          parcelaEncontrada = parcela;
          
          // Buscar o pedido real usando o pedido_id da parcela
          const { data: pedidoReal, error: pedidoRealError } = await supabase
            .from('pedidos')
            .select('id, status, client_id, valor_total, is_subscription, asaas_subscription_id')
            .eq('id', parcela.pedido_id)
            .maybeSingle();
          
          if (pedidoReal) {
            pedido = pedidoReal;
            log('info', '✅ Pedido encontrado via parcela', { 
              pedidoId: pedidoReal.id, 
              parcelaOriginal: pedidoId 
            });
          } else {
            log('error', '❌ Pedido da parcela não encontrado', { 
              parcelaId: parcela.id, 
              pedidoId: parcela.pedido_id,
              error: pedidoRealError?.message 
            });
          }
        } else {
          log('warn', '⚠️ Nem pedido nem parcela encontrados', { externalReference: pedidoId, parcelaError: parcelaError?.message });
        }
      }

      if (!pedido) {
        log('error', '❌ Pedido não encontrado (nem via parcela)', { pedidoId, error: pedidoError?.message });
        
        await supabase
          .from('webhook_logs')
          .update({ 
            status: 'error',
            error_message: `Pedido não encontrado (nem via parcela): ${pedidoId}`,
            processed_at: new Date().toISOString()
          })
          .eq('webhook_id', event.id)
          .eq('provider', 'asaas');

        return new Response(
          JSON.stringify({ success: true, message: 'Order not found' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Se encontramos via parcela, atualizar diretamente essa parcela como paga
      if (parcelaEncontrada) {
        log('info', '💳 Atualizando parcela específica como paga', { 
          parcelaId: parcelaEncontrada.id,
          numeroParcela: parcelaEncontrada.numero_parcela
        });
        
        const { error: parcelaUpdateError } = await supabase
          .from('parcelas')
          .update({
            status: 'pago',
            data_pagamento: payment.paymentDate || payment.confirmedDate || new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', parcelaEncontrada.id);
        
        if (parcelaUpdateError) {
          log('error', '❌ Erro ao atualizar parcela encontrada', { 
            parcelaId: parcelaEncontrada.id, 
            error: parcelaUpdateError.message 
          });
        } else {
          log('info', '✅ Parcela atualizada para PAGO via external_reference direto', { 
            parcelaId: parcelaEncontrada.id,
            numeroParcela: parcelaEncontrada.numero_parcela
          });
        }
        
        // Se é a primeira parcela, atualizar o status do pedido conforme fluxo Opção B
        if (parcelaEncontrada.numero_parcela === 1) {
          const novoStatus = 'aguardando_contrato'; // Opção B: pagamento → aguardando_contrato
          
          await supabase
            .from('pedidos')
            .update({
              status: novoStatus,
              transaction_id: payment.id,
              log_pagamento: {
                provider: 'asaas',
                payment_id: payment.id,
                payment_status: 'approved',
                payment_date: payment.paymentDate || payment.confirmedDate || new Date().toISOString(),
                value: payment.value,
                parcela_numero: parcelaEncontrada.numero_parcela,
                confirmed_at: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', pedido.id);
          
          log('info', '✅ Pedido atualizado para aguardando_contrato após 1ª parcela', { 
            pedidoId: pedido.id,
            parcelaNumero: parcelaEncontrada.numero_parcela
          });
        }
        
        // Registrar log do evento
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'parcela_payment_confirmed',
            descricao: `Pagamento de parcela ${parcelaEncontrada.numero_parcela} confirmado - R$ ${payment.value.toFixed(2)}`,
            detalhes: {
              pedido_id: pedido.id,
              parcela_id: parcelaEncontrada.id,
              parcela_numero: parcelaEncontrada.numero_parcela,
              payment_id: payment.id,
              event_type: event.event,
              valor: payment.value,
              data_pagamento: payment.paymentDate || payment.confirmedDate,
              timestamp: new Date().toISOString()
            }
          });
        
        // Atualizar log do webhook como processado
        await supabase
          .from('webhook_logs')
          .update({ 
            status: 'processed',
            processed_at: new Date().toISOString()
          })
          .eq('webhook_id', event.id)
          .eq('provider', 'asaas');
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Parcela payment processed successfully',
            pedidoId: pedido.id,
            parcelaId: parcelaEncontrada.id,
            parcelaNumero: parcelaEncontrada.numero_parcela,
            paymentId: payment.id
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      log('info', '✅ Pedido encontrado', { 
        pedidoId, 
        statusAtual: pedido.status,
        valorPedido: pedido.valor_total,
        valorPago: payment.value,
        isSubscription: pedido.is_subscription,
        isSubscriptionPayment
      });

      // ============================================================
      // PAGAMENTO DE ASSINATURA (parcela recorrente)
      // ============================================================
      if (isSubscriptionPayment || pedido.is_subscription) {
        log('info', '📅 Processando pagamento de assinatura/parcela', {
          subscriptionId: payment.subscription,
          paymentValue: payment.value
        });

        // Buscar próxima parcela pendente
        const { data: parcelas, error: parcelasQueryError } = await supabase
          .from('parcelas')
          .select('id, numero_parcela, status, valor')
          .eq('pedido_id', pedidoId)
          .in('status', ['pendente', 'aguardando_pagamento', 'atrasado'])
          .order('numero_parcela', { ascending: true })
          .limit(1);

        if (!parcelasQueryError && parcelas && parcelas.length > 0) {
          const parcela = parcelas[0];
          
          log('info', '✅ Parcela encontrada para atualizar', { 
            parcelaId: parcela.id, 
            numeroParcela: parcela.numero_parcela 
          });

          // Atualizar parcela como paga
          const { error: parcelaUpdateError } = await supabase
            .from('parcelas')
            .update({
              status: 'pago',
              data_pagamento: payment.paymentDate || payment.confirmedDate || new Date().toISOString(),
              transaction_id: payment.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', parcela.id);

          if (parcelaUpdateError) {
            log('warn', '⚠️ Erro ao atualizar parcela', { parcelaId: parcela.id, error: parcelaUpdateError.message });
          } else {
            log('info', '✅ Parcela atualizada para PAGO', { parcelaId: parcela.id, numeroParcela: parcela.numero_parcela });
          }

          // Verificar se é a primeira parcela (ativa o pedido)
          if (parcela.numero_parcela === 1 && pedido.status !== 'pago') {
            await supabase
              .from('pedidos')
              .update({
                status: 'pago',
                payment_status: 'approved',
                transaction_id: payment.id,
                log_pagamento: {
                  provider: 'asaas',
                  payment_id: payment.id,
                  payment_status: 'approved',
                  payment_date: payment.paymentDate || payment.confirmedDate || new Date().toISOString(),
                  value: payment.value,
                  is_subscription: true,
                  confirmed_at: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
              })
              .eq('id', pedidoId);

            log('info', '✅ Pedido ativado após primeira parcela', { pedidoId });
          }

          // Verificar se todas as parcelas foram pagas
          const { data: parcelasPendentes } = await supabase
            .from('parcelas')
            .select('id')
            .eq('pedido_id', pedidoId)
            .neq('status', 'pago');

          if (!parcelasPendentes || parcelasPendentes.length === 0) {
            // Todas as parcelas pagas - marcar assinatura como concluída
            await supabase
              .from('assinaturas')
              .update({
                status: 'concluida',
                updated_at: new Date().toISOString()
              })
              .eq('pedido_id', pedidoId);

            log('info', '🎉 Todas as parcelas pagas - assinatura concluída', { pedidoId });
          }
        } else {
          // Sem parcelas pendentes - criar registro ou é pagamento avulso de assinatura
          log('info', '⚠️ Nenhuma parcela pendente encontrada, registrando pagamento direto');
        }

        // Registrar log do evento
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'subscription_payment_confirmed',
            descricao: `Pagamento de assinatura confirmado - R$ ${payment.value.toFixed(2)}`,
            detalhes: {
              pedido_id: pedidoId,
              payment_id: payment.id,
              subscription_id: payment.subscription,
              event_type: event.event,
              valor: payment.value,
              data_pagamento: payment.paymentDate || payment.confirmedDate,
              timestamp: new Date().toISOString()
            }
          });

      } else {
        // ============================================================
        // PAGAMENTO AVULSO (único)
        // ============================================================
        
        // Atualizar status do pedido para "pago"
        const { error: updateError } = await supabase
          .from('pedidos')
          .update({
            status: 'pago',
            payment_status: 'approved',
            metodo_pagamento: 'pix_asaas',
            transaction_id: payment.id,
            log_pagamento: {
              provider: 'asaas',
              payment_id: payment.id,
              payment_status: 'approved',
              payment_date: payment.paymentDate || payment.confirmedDate || new Date().toISOString(),
              value: payment.value,
              net_value: payment.netValue,
              billing_type: payment.billingType,
              confirmed_at: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', pedidoId);

        if (updateError) {
          log('error', '❌ Erro ao atualizar pedido', { pedidoId, error: updateError.message });
          throw new Error(`Erro ao atualizar pedido: ${updateError.message}`);
        }

        log('info', '✅ Pedido atualizado para PAGO', { pedidoId });

        // Atualizar parcela se existir (pagamento único também pode ter parcela)
        const { data: parcelas, error: parcelasQueryError } = await supabase
          .from('parcelas')
          .select('id, status')
          .eq('pedido_id', pedidoId)
          .in('status', ['pendente', 'aguardando_pagamento', 'atrasado'])
          .order('numero_parcela', { ascending: true })
          .limit(1);

        if (!parcelasQueryError && parcelas && parcelas.length > 0) {
          const parcelaId = parcelas[0].id;
          
          await supabase
            .from('parcelas')
            .update({
              status: 'pago',
              data_pagamento: payment.paymentDate || payment.confirmedDate || new Date().toISOString(),
              transaction_id: payment.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', parcelaId);

          log('info', '✅ Parcela atualizada para PAGO', { parcelaId });
        }

        // Registrar log do evento de sistema
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'payment_confirmed_asaas_webhook',
            descricao: `Pagamento confirmado via webhook Asaas`,
            detalhes: {
              pedido_id: pedidoId,
              payment_id: payment.id,
              event_type: event.event,
              valor: payment.value,
              valor_liquido: payment.netValue,
              data_pagamento: payment.paymentDate || payment.confirmedDate,
              billing_type: payment.billingType,
              timestamp: new Date().toISOString()
            }
          });
      }

      // Atualizar log do webhook como processado
      await supabase
        .from('webhook_logs')
        .update({ 
          status: 'processed',
          processed_at: new Date().toISOString()
        })
        .eq('webhook_id', event.id)
        .eq('provider', 'asaas');

      log('info', '🎉 Webhook processado com sucesso', { 
        eventId: event.id,
        pedidoId,
        paymentId: payment.id,
        isSubscription: isSubscriptionPayment || pedido.is_subscription
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment processed successfully',
          pedidoId,
          paymentId: payment.id,
          isSubscriptionPayment
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // EVENTOS DE PIX AUTOMÁTICO (DÉBITO RECORRENTE)
    // ========================================
    
    if (DIRECT_AUTHORIZATION_EVENTS.includes(event.event)) {
      log('info', '🔄 Processando evento de PIX Automático', { eventType: event.event });

      const eventData = event as any;
      const pedidoId = eventData.externalReference || eventData.payment?.externalReference;

      if (event.event === 'DIRECT_AUTHORIZATION_CREATED') {
        log('info', '✅ Cliente AUTORIZOU débito automático recorrente', { 
          authId: eventData.id,
          pedidoId 
        });
        
        if (pedidoId) {
          await supabase.from('pedidos').update({
            pix_automatico_autorizado: true,
            pix_automatico_auth_id: eventData.id,
            updated_at: new Date().toISOString()
          }).eq('id', pedidoId);
        }

        await supabase.from('log_eventos_sistema').insert({
          tipo_evento: 'pix_automatico_autorizado',
          descricao: 'Cliente autorizou débito automático PIX',
          detalhes: { pedido_id: pedidoId, auth_id: eventData.id, event: event.event }
        });
      }

      if (event.event === 'DIRECT_AUTHORIZATION_REJECTED') {
        log('warn', '❌ Cliente REJEITOU débito automático', { pedidoId });
        
        await supabase.from('log_eventos_sistema').insert({
          tipo_evento: 'pix_automatico_rejeitado',
          descricao: 'Cliente rejeitou autorização de débito automático PIX',
          detalhes: { pedido_id: pedidoId, event: event.event }
        });
      }

      if (event.event === 'DIRECT_AUTHORIZATION_PAYMENT_RECEIVED' && event.payment) {
        log('info', '💰 Parcela debitada automaticamente via PIX Automático', {
          paymentId: event.payment.id,
          value: event.payment.value
        });
        
        // Processar como pagamento normal (reutilizar lógica existente)
        // O fluxo de PAYMENT_CONFIRMED_EVENTS já trata isso
      }

      if (event.event === 'DIRECT_AUTHORIZATION_PAYMENT_FAILED') {
        log('error', '❌ Falha no débito automático PIX', { pedidoId });
        
        await supabase.from('log_eventos_sistema').insert({
          tipo_evento: 'pix_automatico_falha',
          descricao: 'Falha no débito automático PIX - saldo insuficiente ou conta encerrada',
          detalhes: { pedido_id: pedidoId, event: event.event, payload: eventData }
        });
      }

      if (event.event === 'DIRECT_AUTHORIZATION_CANCELLED') {
        log('warn', '🚫 Autorização PIX Automático cancelada', { pedidoId });
        
        if (pedidoId) {
          await supabase.from('pedidos').update({
            pix_automatico_autorizado: false,
            updated_at: new Date().toISOString()
          }).eq('id', pedidoId);
        }

        await supabase.from('log_eventos_sistema').insert({
          tipo_evento: 'pix_automatico_cancelado',
          descricao: 'Autorização de débito automático PIX foi cancelada',
          detalhes: { pedido_id: pedidoId, event: event.event }
        });
      }

      await supabase.from('webhook_logs').update({ 
        status: 'processed',
        processed_at: new Date().toISOString()
      }).eq('webhook_id', event.id).eq('provider', 'asaas');

      return new Response(
        JSON.stringify({ success: true, message: 'Direct authorization event processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // OUTROS EVENTOS (log apenas)
    // ========================================
    
    log('info', '📋 Evento registrado (não requer ação)', { 
      eventType: event.event,
      paymentId: event.payment?.id
    });

    // Atualizar log do webhook
    await supabase
      .from('webhook_logs')
      .update({ 
        status: 'acknowledged',
        processed_at: new Date().toISOString()
      })
      .eq('webhook_id', event.id)
      .eq('provider', 'asaas');

    return new Response(
      JSON.stringify({ success: true, message: 'Event acknowledged' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    log('error', '❌ Erro no webhook', { error: error.message, stack: error.stack });
    
    // Sempre retornar 200 para evitar que o Asaas pause a fila
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: 'Internal error but acknowledged'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
