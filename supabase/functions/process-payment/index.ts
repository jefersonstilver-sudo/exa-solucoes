// Mercado Pago PIX Payment Processing (PRODUÇÃO)
// Version: 4.0.0 - API REST direta (compatível com Deno)
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 [PIX-PROD] Iniciando process-payment com API REST');
    
    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obter e validar pedidoId
    const { pedidoId } = await req.json();
    
    if (!pedidoId) {
      throw new Error('pedidoId é obrigatório');
    }

    console.log(`📦 [PIX-PROD] Buscando pedido: ${pedidoId}`);

    // Buscar dados do pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !pedido) {
      console.error('❌ [PIX-PROD] Pedido não encontrado:', pedidoError);
      throw new Error('Pedido não encontrado');
    }

    console.log(`✅ [PIX-PROD] Pedido encontrado. Valor: R$ ${pedido.valor_total}`);

    // Verificar se já existe pagamento PIX gerado
    if (pedido.log_pagamento?.pixData?.paymentId) {
      console.log('⚠️ [PIX-PROD] Pagamento PIX já foi gerado anteriormente');
      return new Response(
        JSON.stringify({
          success: true,
          qrCodeBase64: pedido.log_pagamento.pixData.qrCodeBase64,
          qrCode: pedido.log_pagamento.pixData.qrCode,
          paymentId: pedido.log_pagamento.pixData.paymentId,
          status: pedido.log_pagamento.pixData.status || 'pending',
          message: 'Pagamento PIX já existe'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Configurar credenciais Mercado Pago
    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!mpAccessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN não configurado');
    }

    console.log('🔑 [PIX-PROD] Credenciais carregadas');

    // Buscar email do cliente
    const { data: userData } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', pedido.client_id)
      .single();

    const payerEmail = userData?.email || 'contato@indexa.com.br';

    // Criar pagamento PIX via API REST
    console.log('💳 [PIX-PROD] Criando pagamento PIX...');
    
    const paymentPayload = {
      transaction_amount: pedido.valor_total,
      description: `Campanha publicitária digital - Pedido #${pedidoId.substring(0, 8)}`,
      payment_method_id: 'pix',
      payer: {
        email: payerEmail,
        first_name: 'Cliente',
        last_name: 'Indexa'
      },
      external_reference: pedidoId,
      metadata: {
        pedido_id: pedidoId,
        payment_method: 'pix',
        total_amount: pedido.valor_total
      }
    };

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': pedidoId
      },
      body: JSON.stringify(paymentPayload)
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.text();
      console.error('❌ [PIX-PROD] Erro Mercado Pago:', errorData);
      throw new Error(`Mercado Pago API error: ${mpResponse.status}`);
    }

    const mpData = await mpResponse.json();
    console.log('✅ [PIX-PROD] Pagamento PIX criado:', mpData);

    // Extrair dados do PIX
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || '';
    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code || '';
    const paymentId = mpData.id;

    if (!qrCodeBase64 || !qrCode) {
      throw new Error('QR Code PIX não foi gerado');
    }

    // Calcular data de expiração (30 minutos)
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 30);

    // Atualizar pedido com dados do PIX
    const pixData = {
      qrCodeBase64,
      qrCode,
      paymentId: String(paymentId),
      status: mpData.status || 'pending',
      expiresAt: expirationDate.toISOString(),
      createdAt: new Date().toISOString(),
      mpResponse: {
        id: mpData.id,
        status: mpData.status,
        status_detail: mpData.status_detail
      }
    };

    const { error: updateError } = await supabase
      .from('pedidos')
      .update({ 
        log_pagamento: { 
          pixData,
          method: 'pix',
          lastUpdated: new Date().toISOString()
        }
      })
      .eq('id', pedidoId);

    if (updateError) {
      console.error('❌ [PIX-PROD] Erro ao atualizar pedido:', updateError);
      throw updateError;
    }

    // Log do evento
    await supabase
      .from('log_eventos_sistema')
      .insert({
        tipo_evento: 'pix_gerado',
        descricao: `QR Code PIX gerado para pedido ${pedidoId}`,
        detalhes: {
          pedidoId,
          paymentId: String(paymentId),
          valor: pedido.valor_total,
          status: mpData.status
        }
      });

    console.log('🎉 [PIX-PROD] Processo concluído com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        qrCodeBase64,
        qrCode,
        paymentId: String(paymentId),
        status: mpData.status || 'pending',
        expiresAt: expirationDate.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [PIX-PROD] Erro:', error);
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
