
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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
      transaction_amount: paymentData.transaction_amount
    });

    // Verificar se foi aprovado
    const isApproved = paymentData.status === 'approved';
    let statusUpdated = false;

    if (isApproved && pedido.status === 'pendente') {
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
            mercadopago_data: paymentData
          }
        })
        .eq('id', pedidoId);

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
  
  return handleRequest(req);
});
