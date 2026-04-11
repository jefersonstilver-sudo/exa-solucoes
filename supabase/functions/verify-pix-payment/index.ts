
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function handleCorsPreflightRequest() {
  return new Response(null, { headers: corsHeaders });
}

function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return createClient(supabaseUrl, supabaseKey);
}

async function verifyPixPayment(supabase: any, pedidoId: string) {
  try {
    console.log(`🔍 [VERIFY_PIX] Verificando pagamento para pedido: ${pedidoId}`);

    // 🔒 CRITICAL: Check if this payment was already used for another order
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('pedidos')
      .select('id, status, log_pagamento, created_at')
      .neq('id', pedidoId)
      .in('status', ['pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo']);

    if (allOrdersError) {
      console.error(`❌ [VERIFY_PIX] Erro ao buscar outros pedidos:`, allOrdersError);
    }

    // Buscar pedido e dados de pagamento
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !pedido) {
      throw new Error(`Pedido não encontrado: ${pedidoError?.message}`);
    }

    console.log(`📋 [VERIFY_PIX] Pedido encontrado:`, {
      id: pedido.id,
      status: pedido.status,
      valor_total: pedido.valor_total,
      hasLogPagamento: !!pedido.log_pagamento
    });

    // Se já está pago, não precisa verificar
    if (pedido.status === 'pago' || pedido.status.includes('pago')) {
      return {
        success: true,
        payment_found: true,
        payment_approved: true,
        payment_status: 'approved',
        payment_amount: pedido.valor_total,
        status_updated: false,
        message: 'Pedido já está marcado como pago'
      };
    }

    // Extrair dados do pagamento do log
    const logPagamento = pedido.log_pagamento as any;
    if (!logPagamento) {
      throw new Error('Log de pagamento não encontrado');
    }

    // Buscar dados PIX
    const pixData = logPagamento.pixData || logPagamento.pix_data;
    if (!pixData || !pixData.paymentId) {
      throw new Error('ID do pagamento PIX não encontrado');
    }

    const paymentId = pixData.paymentId;
    console.log(`💳 [VERIFY_PIX] Consultando pagamento MP: ${paymentId}`);

    // 🔒 CRITICAL: Verify this paymentId is not already used by another PAID order
    if (allOrders && allOrders.length > 0) {
      for (const otherOrder of allOrders) {
        const otherLogPagamento = otherOrder.log_pagamento as any;
        if (otherLogPagamento) {
          const otherPixData = otherLogPagamento.pixData || otherLogPagamento.pix_data;
          if (otherPixData?.paymentId === paymentId) {
            console.error(`🚨 [VERIFY_PIX] SEGURANÇA: paymentId ${paymentId} já usado no pedido ${otherOrder.id} (status: ${otherOrder.status})`);
            throw new Error(`Este pagamento já foi usado em outro pedido (${otherOrder.id}). Contate o suporte.`);
          }
        }
      }
    }

    // Consultar API do Mercado Pago
    const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!MP_ACCESS_TOKEN) {
      throw new Error('Token do Mercado Pago não configurado');
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!mpResponse.ok) {
      throw new Error(`Erro na API MP: ${mpResponse.status} - ${mpResponse.statusText}`);
    }

    const paymentData = await mpResponse.json();
    console.log(`✅ [VERIFY_PIX] Resposta MP:`, {
      id: paymentData.id,
      status: paymentData.status,
      transaction_amount: paymentData.transaction_amount,
      external_reference: paymentData.external_reference
    });

    // 🔒 CRITICAL: Verify external_reference matches this pedidoId
    if (paymentData.external_reference && paymentData.external_reference !== pedidoId) {
      console.error(`🚨 [VERIFY_PIX] SEGURANÇA: external_reference ${paymentData.external_reference} não corresponde ao pedido ${pedidoId}`);
      throw new Error(`Este pagamento pertence a outro pedido (${paymentData.external_reference})`);
    }

    // Verificar se foi aprovado
    const isApproved = paymentData.status === 'approved';
    let statusUpdated = false;

    if (isApproved && pedido.status === 'pendente') {
      // 🔒 CRITICAL: Double-check pedido status before updating (avoid race conditions)
      const { data: pedidoRecheck, error: recheckError } = await supabase
        .from('pedidos')
        .select('status')
        .eq('id', pedidoId)
        .single();

      if (recheckError || !pedidoRecheck) {
        throw new Error('Falha ao verificar status atual do pedido');
      }

      if (pedidoRecheck.status !== 'pendente') {
        console.warn(`⚠️ [VERIFY_PIX] Pedido ${pedidoId} não está mais pendente (status: ${pedidoRecheck.status})`);
        return {
          success: true,
          payment_found: true,
          payment_approved: isApproved,
          payment_status: paymentData.status,
          payment_amount: paymentData.transaction_amount,
          status_updated: false,
          message: 'Pedido já foi processado por outra verificação'
        };
      }

      // Atualizar status do pedido para pago
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({
          status: 'pago_pendente_video',
          log_pagamento: {
            ...logPagamento,
            payment_verified_manually: true,
            payment_status: 'approved',
            verified_at: new Date().toISOString(),
            mercadopago_data: paymentData,
            payment_security_checks: {
              duplicate_check: true,
              external_reference_match: true,
              checked_at: new Date().toISOString()
            }
          }
        })
        .eq('id', pedidoId)
        .eq('status', 'pendente'); // 🔒 CRITICAL: Only update if still pendente

      if (updateError) {
        console.error(`❌ [VERIFY_PIX] Erro ao atualizar status:`, updateError);
      } else {
        statusUpdated = true;
        console.log(`✅ [VERIFY_PIX] Status atualizado para pago_pendente_video`);

        // Log do evento
        await supabase
          .from('payment_status_tracking')
          .insert({
            pedido_id: pedidoId,
            status_anterior: pedido.status,
            status_novo: 'pago_pendente_video',
            origem: 'manual_verification',
            detalhes: {
              payment_id: paymentId,
              mercadopago_status: paymentData.status,
              verified_manually: true,
              verification_timestamp: new Date().toISOString()
            }
          });
      }
    }

    return {
      success: true,
      payment_found: true,
      payment_approved: isApproved,
      payment_status: paymentData.status,
      payment_amount: paymentData.transaction_amount,
      status_updated: statusUpdated,
      payment_id: paymentId,
      mercadopago_data: {
        id: paymentData.id,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        date_approved: paymentData.date_approved,
        transaction_amount: paymentData.transaction_amount
      }
    };

  } catch (error: any) {
    console.error(`❌ [VERIFY_PIX] Erro na verificação:`, error);
    return {
      success: false,
      error: error.message,
      payment_found: false,
      payment_approved: false
    };
  }
}

async function handleRequest(req: Request) {
  try {
    const supabase = createSupabaseClient();
    const { pedido_id } = await req.json();

    if (!pedido_id) {
      throw new Error('ID do pedido é obrigatório');
    }

    const result = await verifyPixPayment(supabase, pedido_id);

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('[VERIFY_PIX] Erro geral:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        payment_found: false,
        payment_approved: false
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }
  
  // Rate limiting: 20 payment verifications per minute per IP
  const clientId = getClientIdentifier(req);
  const rateLimitResult = checkRateLimit(clientId, {
    maxAttempts: 20,
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000 // 5 minutes block
  });

  if (!rateLimitResult.allowed) {
    console.warn(`🚫 [VERIFY-PIX] Rate limit exceeded for ${clientId}`);
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }
  
  return handleRequest(req);
});
