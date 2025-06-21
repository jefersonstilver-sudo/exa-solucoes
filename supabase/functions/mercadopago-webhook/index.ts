
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

    const payload = await req.json();
    console.log("🔔 [MercadoPago Webhook] UNIFIED - Webhook recebido:", payload);

    // Log do webhook
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        origem: 'mercadopago-unified',
        payload: payload,
        status: 'received',
        recebido_em: new Date().toISOString()
      });

    if (logError) {
      console.error("❌ Erro ao salvar log do webhook:", logError);
    }

    // Extrair dados do pagamento
    const paymentData = payload.data || payload;
    const paymentStatus = payload.action || paymentData.status;
    const externalReference = paymentData.external_reference;
    const paymentId = paymentData.id;
    const amount = paymentData.transaction_amount;

    console.log("📊 [MercadoPago Webhook] Dados extraídos:", {
      paymentStatus,
      externalReference,
      paymentId,
      amount
    });

    if (paymentStatus === 'payment.approved' || paymentStatus === 'approved') {
      console.log("✅ [MercadoPago Webhook] Pagamento aprovado detectado");

      // CORREÇÃO CRÍTICA: Buscar pedido por transaction_id ou external_reference
      let pedidoQuery = supabase
        .from('pedidos')
        .select('*');

      // Tentar encontrar por external_reference (transaction_id) primeiro
      if (externalReference) {
        pedidoQuery = pedidoQuery.eq('transaction_id', externalReference);
      } else if (amount) {
        // Fallback: buscar por valor (menos confiável, mas necessário para transações antigas)
        pedidoQuery = pedidoQuery
          .eq('valor_total', amount)
          .eq('status', 'pendente')
          .order('created_at', { ascending: false })
          .limit(1);
      } else {
        throw new Error("Não foi possível identificar o pedido (sem external_reference ou amount)");
      }

      const { data: pedidos, error: pedidoError } = await pedidoQuery;

      if (pedidoError) {
        throw new Error(`Erro ao buscar pedido: ${pedidoError.message}`);
      }

      if (!pedidos || pedidos.length === 0) {
        console.warn("⚠️ [MercadoPago Webhook] Nenhum pedido encontrado para:", {
          externalReference,
          amount
        });
        
        // Log para investigação posterior
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'WEBHOOK_ORPHAN_PAYMENT',
            descricao: `Pagamento órfão detectado: external_reference=${externalReference}, amount=${amount}, paymentId=${paymentId}`
          });

        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Pedido não encontrado",
            investigation_needed: true 
          }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const pedido = Array.isArray(pedidos) ? pedidos[0] : pedidos;

      console.log("🎯 [MercadoPago Webhook] Pedido encontrado:", {
        id: pedido.id,
        transaction_id: pedido.transaction_id,
        valor_total: pedido.valor_total,
        status_atual: pedido.status
      });

      // Atualizar pedido para pago
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({
          status: 'pago_pendente_video',
          log_pagamento: {
            ...pedido.log_pagamento,
            webhook_data: payload,
            payment_confirmed_at: new Date().toISOString(),
            mercadopago_payment_id: paymentId,
            unified_system_confirmed: true,
            found_by: externalReference ? 'transaction_id' : 'amount_fallback'
          }
        })
        .eq('id', pedido.id);

      if (updateError) {
        throw updateError;
      }

      // Atualizar sessão de transação se existir
      if (pedido.transaction_id) {
        const { error: sessionError } = await supabase
          .from('transaction_sessions')
          .update({
            status: 'completed',
            payment_external_id: paymentId,
            updated_at: new Date().toISOString()
          })
          .eq('transaction_id', pedido.transaction_id);

        if (sessionError) {
          console.warn("⚠️ Erro ao atualizar sessão de transação:", sessionError);
        }
      }

      console.log("✅ [MercadoPago Webhook] Pedido atualizado com sucesso:", pedido.id);

      // Log de sucesso
      await supabase
        .from('log_eventos_sistema')
        .insert({
          tipo_evento: 'UNIFIED_PAYMENT_CONFIRMED',
          descricao: `Pagamento confirmado via webhook: pedido_id=${pedido.id}, transaction_id=${pedido.transaction_id}, valor=${pedido.valor_total}`
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Pagamento processado com sucesso",
          pedido_id: pedido.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Para outros tipos de webhook
    console.log("ℹ️ [MercadoPago Webhook] Webhook não relacionado a pagamento aprovado");
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Webhook recebido mas não processado" 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("❌ [MercadoPago Webhook] Erro:", error);
    
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
