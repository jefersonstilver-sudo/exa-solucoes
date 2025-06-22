
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
    console.log("🔔 [MercadoPago Webhook] SISTEMA PIX COMPLETO - Webhook recebido:", payload);

    // Log do webhook
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        origem: 'mercadopago-pix-completo',
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

      // 🔥 BUSCA APRIMORADA: Priorizar transaction_id
      let pedidoQuery = supabase.from('pedidos').select('*');
      
      if (externalReference) {
        // Buscar por transaction_id (método preferencial)
        console.log("🔍 Buscando pedido por transaction_id:", externalReference);
        pedidoQuery = pedidoQuery.eq('transaction_id', externalReference);
      } else {
        // Fallback: buscar por valor e status
        console.log("🔍 Fallback: Buscando por valor e status pendente");
        pedidoQuery = pedidoQuery
          .eq('valor_total', amount)
          .eq('status', 'pendente')
          .order('created_at', { ascending: false })
          .limit(1);
      }

      const { data: pedidos, error: pedidoError } = await pedidoQuery;

      if (pedidoError) {
        throw new Error(`Erro ao buscar pedido: ${pedidoError.message}`);
      }

      if (!pedidos || pedidos.length === 0) {
        console.warn("⚠️ [MercadoPago Webhook] Nenhum pedido encontrado para:", {
          externalReference,
          amount,
          searchMethod: externalReference ? 'transaction_id' : 'valor_fallback'
        });
        
        // Log para investigação posterior
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'WEBHOOK_PEDIDO_NAO_ENCONTRADO',
            descricao: `Pagamento confirmado mas pedido não encontrado: external_reference=${externalReference}, amount=${amount}, paymentId=${paymentId}`
          });

        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Pedido não encontrado - investigação necessária",
            details: { externalReference, amount, paymentId }
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
        status_atual: pedido.status,
        lista_paineis: pedido.lista_paineis
      });

      // 🔥 ATUALIZAÇÃO COMPLETA DO PEDIDO
      const updatedLogPagamento = {
        ...(pedido.log_pagamento || {}),
        payment_confirmed_at: new Date().toISOString(),
        mercadopago_payment_id: paymentId,
        external_reference: externalReference,
        payment_status: 'approved',
        webhook_processed: true,
        sistema_pix_completo: true,
        found_by_method: externalReference ? 'transaction_id' : 'valor_fallback'
      };

      const { error: updateError } = await supabase
        .from('pedidos')
        .update({
          status: 'pago_pendente_video', // 🔥 AGUARDANDO UPLOAD DE VÍDEO
          log_pagamento: updatedLogPagamento
        })
        .eq('id', pedido.id);

      if (updateError) {
        throw updateError;
      }

      // Tracking do status
      await supabase
        .from('payment_status_tracking')
        .insert({
          pedido_id: pedido.id,
          status_anterior: pedido.status,
          status_novo: 'pago_pendente_video',
          origem: 'mercadopago_webhook_pix_completo',
          detalhes: {
            payment_id: paymentId,
            external_reference: externalReference,
            amount: amount,
            transaction_id: pedido.transaction_id,
            lista_paineis: pedido.lista_paineis
          }
        });

      console.log("✅ [MercadoPago Webhook] Pedido atualizado com sucesso:", {
        pedidoId: pedido.id,
        newStatus: 'pago_pendente_video',
        listaPaineis: pedido.lista_paineis?.length || 0
      });

      // Log de sucesso do sistema PIX completo
      await supabase
        .from('log_eventos_sistema')
        .insert({
          tipo_evento: 'PIX_COMPLETO_CONFIRMADO',
          descricao: `Sistema PIX completo: Pedido ${pedido.id} confirmado via webhook. Transaction: ${pedido.transaction_id}, Valor: ${pedido.valor_total}, Painéis: ${pedido.lista_paineis?.length || 0}`
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Sistema PIX completo - Pagamento processado com sucesso",
          pedido_id: pedido.id,
          status: 'pago_pendente_video',
          paineis_count: pedido.lista_paineis?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Para outros tipos de webhook
    console.log("ℹ️ [MercadoPago Webhook] Webhook recebido mas não é pagamento aprovado:", paymentStatus);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Webhook recebido mas não processado",
        action: paymentStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("❌ [MercadoPago Webhook] Erro no sistema PIX completo:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        sistema: 'pix_completo'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
