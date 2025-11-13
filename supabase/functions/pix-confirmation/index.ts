import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    
    console.log("🔔 [PIX Confirmation] Webhook recebido:", body);
    // Log do webhook
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        origem: 'mercadopago-pix-confirmation',
        payload: body,
        status: 'received',
        recebido_em: new Date().toISOString()
      });

    if (logError) {
      console.error("❌ Erro ao salvar log do webhook:", logError);
    }

    // Extrair dados - aceitar múltiplos formatos
    const transactionId = body.transaction_id || body.external_reference || body.pedido_id;
    const paymentId = body.payment_id || body.id;
    const status = body.status || body.payment_status;
    const amount = body.amount || body.transaction_amount || body.valor_total;

    console.log("📊 [PIX Confirmation] Dados extraídos:", {
      transactionId,
      paymentId,
      status,
      amount
    });

    // Validar status aprovado
    if (status !== 'approved' && status !== 'pago' && status !== 'confirmed') {
      console.log("ℹ️ [PIX Confirmation] Status não é aprovado:", status);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Webhook recebido mas status não é aprovado",
          status: status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar pedido por transaction_id
    if (!transactionId) {
      console.error("❌ [PIX Confirmation] transaction_id ausente");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "transaction_id é obrigatório" 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { data: pedidos, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('transaction_id', transactionId)
      .eq('status', 'pendente');

    if (pedidoError) {
      throw new Error(`Erro ao buscar pedido: ${pedidoError.message}`);
    }

    if (!pedidos || pedidos.length === 0) {
      console.warn("⚠️ [PIX Confirmation] Pedido não encontrado:", transactionId);
      
      await supabase
        .from('log_eventos_sistema')
        .insert({
          tipo_evento: 'PIX_PEDIDO_NAO_ENCONTRADO',
          descricao: `Confirmação PIX recebida mas pedido não encontrado: transaction_id=${transactionId}, amount=${amount}, paymentId=${paymentId}`
        });

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Pedido não encontrado",
          transaction_id: transactionId
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const pedido = pedidos[0];

    console.log("🎯 [PIX Confirmation] Pedido encontrado:", {
      id: pedido.id,
      transaction_id: pedido.transaction_id,
      valor_total: pedido.valor_total,
      status_atual: pedido.status
    });

    // Verificar duplicata
    if (paymentId) {
      const { data: alreadyProcessed } = await supabase
        .rpc('check_payment_already_processed', { p_payment_id: paymentId.toString() });

      if (alreadyProcessed) {
        console.warn("🚫 [PIX Confirmation] Payment já processado:", paymentId);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Payment já processado",
            payment_id: paymentId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Atualizar pedido para pago
    const updatedLogPagamento = {
      ...(pedido.log_pagamento || {}),
      payment_confirmed_at: new Date().toISOString(),
      payment_id: paymentId,
      payment_status: 'approved',
      webhook_processed: true,
      webhook_source: 'mercadopago-webhook',
      confirmation_amount: amount
    };

    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        status: 'pago_pendente_video',
        log_pagamento: updatedLogPagamento
      })
      .eq('id', pedido.id);

    if (updateError) {
      throw updateError;
    }

    // Registrar no log de eventos
    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'PIX_CONFIRMADO_WEBHOOK',
        descricao: `PIX confirmado: Pedido ${pedido.id}, Transaction: ${transactionId}, Valor: ${amount}`
      });

    // Registrar controle de processamento
    if (paymentId) {
      await supabase
        .rpc('log_payment_processing_secure', {
          p_payment_id: paymentId.toString(),
          p_webhook_source: 'mercadopago-webhook',
          p_external_reference: transactionId,
          p_amount: amount,
          p_status: 'approved',
          p_details: {
            webhook_source: 'mercadopago',
            transaction_id: transactionId
          }
        });
    }

    console.log("✅ [PIX Confirmation] Pedido atualizado com sucesso:", {
      pedidoId: pedido.id,
      newStatus: 'pago_pendente_video'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Pagamento PIX confirmado com sucesso",
        pedido_id: pedido.id,
        status: 'pago_pendente_video'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("❌ [PIX Confirmation] Erro:", error);
    
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
