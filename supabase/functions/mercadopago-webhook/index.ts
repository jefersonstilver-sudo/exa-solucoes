
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

      // 🔒 VERIFICAÇÃO CRÍTICA: Evitar processamento duplicado
      if (!paymentId) {
        console.error("❌ [MercadoPago Webhook] Payment ID ausente - rejeitando");
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Payment ID é obrigatório para evitar duplicatas" 
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Verificar se payment_id já foi processado
      const { data: alreadyProcessed, error: checkError } = await supabase
        .rpc('check_payment_already_processed', { p_payment_id: paymentId.toString() });

      if (checkError) {
        console.error("❌ [MercadoPago Webhook] Erro ao verificar duplicata:", checkError);
        throw checkError;
      }

      if (alreadyProcessed) {
        console.warn("🚫 [MercadoPago Webhook] Payment ID já processado:", paymentId);
        
        await supabase
          .from('log_eventos_sistema')
          .insert({
            tipo_evento: 'WEBHOOK_DUPLICADO_BLOQUEADO',
            descricao: `Tentativa de reprocessamento bloqueada: payment_id=${paymentId}, external_reference=${externalReference}, amount=${amount}`
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Payment já processado anteriormente",
            payment_id: paymentId,
            duplicate_blocked: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 🔥 BUSCA RESTRITIVA: Apenas por transaction_id (sem fallback perigoso)
      let pedidoQuery = supabase.from('pedidos').select('*');
      
      if (externalReference) {
        // Buscar por transaction_id (método preferencial e mais seguro)
        console.log("🔍 Buscando pedido por transaction_id:", externalReference);
        pedidoQuery = pedidoQuery.eq('transaction_id', externalReference);
      } else {
        // ⚠️ FALLBACK MUITO RESTRITIVO: apenas para casos específicos
        console.warn("⚠️ [MercadoPago Webhook] External reference ausente - aplicando fallback restritivo");
        
        // Só permitir fallback para valores altos (evitar conflitos com testes de R$0.11)
        if (!amount || amount < 1.00) {
          console.error("❌ [MercadoPago Webhook] Fallback negado: valor muito baixo ou ausente");
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "External reference obrigatória para valores baixos",
              payment_id: paymentId,
              amount: amount
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Fallback super restritivo: valor, status E criado nas últimas 24h
        console.log("🔍 Fallback restritivo: Buscando por valor, status e tempo");
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        pedidoQuery = pedidoQuery
          .eq('valor_total', amount)
          .eq('status', 'pendente')
          .gte('created_at', oneDayAgo)
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

      // Tracking do status usando função segura
      const { error: statusTrackingError } = await supabase
        .rpc('log_payment_status_change_secure', {
          p_pedido_id: pedido.id,
          p_status_anterior: pedido.status,
          p_status_novo: 'pago_pendente_video',
          p_origem: 'mercadopago_webhook_pix_completo',
          p_detalhes: {
            payment_id: paymentId,
            external_reference: externalReference,
            amount: amount,
            transaction_id: pedido.transaction_id,
            lista_paineis: pedido.lista_paineis
          }
        });

      if (statusTrackingError) {
        console.error("⚠️ [MercadoPago Webhook] Erro ao registrar tracking de status:", statusTrackingError);
        // Não falhar o webhook por isso, apenas logar
      }

      console.log("✅ [MercadoPago Webhook] Pedido atualizado com sucesso:", {
        pedidoId: pedido.id,
        newStatus: 'pago_pendente_video',
        listaPaineis: pedido.lista_paineis?.length || 0
      });

      // 🔒 REGISTRAR CONTROLE DE PROCESSAMENTO (evitar duplicatas futuras)
      const { data: controlId, error: controlError } = await supabase
        .rpc('log_payment_processing_secure', {
          p_payment_id: paymentId.toString(),
          p_webhook_source: 'mercadopago-pix-completo',
          p_external_reference: externalReference,
          p_pedido_id: pedido.id,
          p_amount: amount,
          p_details: {
            webhook_source: 'mercadopago-pix-completo',
            found_by_method: externalReference ? 'transaction_id' : 'valor_fallback',
            transaction_id: pedido.transaction_id,
            lista_paineis: pedido.lista_paineis
          }
        });

      if (controlError) {
        console.error("⚠️ [MercadoPago Webhook] Erro ao registrar controle:", controlError);
        // Não falhar o webhook por isso, apenas logar
      } else {
        console.log("🔒 [MercadoPago Webhook] Controle de processamento registrado:", controlId);
      }

      // Log de sucesso do sistema PIX completo
      await supabase
        .from('log_eventos_sistema')
        .insert({
          tipo_evento: 'PIX_COMPLETO_CONFIRMADO',
          descricao: `Sistema PIX completo: Pedido ${pedido.id} confirmado via webhook. Transaction: ${pedido.transaction_id}, Valor: ${pedido.valor_total}, Painéis: ${pedido.lista_paineis?.length || 0}, Control ID: ${controlId}`
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Sistema PIX completo - Pagamento processado com sucesso",
          pedido_id: pedido.id,
          status: 'pago_pendente_video',
          paineis_count: pedido.lista_paineis?.length || 0,
          payment_control_id: controlId
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
