// Mercado Pago PIX Payment Processing (PRODUÇÃO)
// Version: 3.0.0 - Recriado com credenciais de produção PIX
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { MercadoPagoConfig, Payment } from "https://esm.sh/mercadopago@2.0.15?target=deno";

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
    console.log('🎯 [PIX-PROD] Iniciando process-payment com credenciais de PRODUÇÃO');
    
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

    // Configurar MercadoPago com credenciais de PRODUÇÃO PIX
    const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!mpAccessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN (PRODUÇÃO) não configurado');
    }

    console.log('🔑 [PIX-PROD] Credenciais de PRODUÇÃO carregadas');

    const mpClient = new MercadoPagoConfig({
      accessToken: mpAccessToken,
      options: { timeout: 10000 }
    });

    const payment = new Payment(mpClient);

    // Buscar email do cliente
    const { data: userData } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', pedido.client_id)
      .single();

    const payerEmail = userData?.email || 'contato@indexa.com.br';

    // Criar pagamento PIX
    console.log('💳 [PIX-PROD] Criando pagamento PIX no Mercado Pago...');
    
    const paymentData = {
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

    const mpResponse = await payment.create({ body: paymentData });

    console.log('✅ [PIX-PROD] Pagamento PIX criado:', mpResponse);

    // Extrair dados do PIX
    const qrCodeBase64 = mpResponse.point_of_interaction?.transaction_data?.qr_code_base64 || '';
    const qrCode = mpResponse.point_of_interaction?.transaction_data?.qr_code || '';
    const paymentId = mpResponse.id?.toString() || '';
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutos

    if (!qrCodeBase64 || !qrCode || !paymentId) {
      throw new Error('Dados do PIX incompletos na resposta do Mercado Pago');
    }

    // Salvar dados no pedido
    const pixData = {
      qrCodeBase64,
      qrCode,
      paymentId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt
    };

    const updatedLogPagamento = {
      ...(pedido.log_pagamento || {}),
      pixData,
      payment_method: 'pix',
      payment_id: paymentId,
      payment_status: 'pending'
    };

    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        log_pagamento: updatedLogPagamento,
        transaction_id: pedidoId
      })
      .eq('id', pedidoId);

    if (updateError) {
      console.error('❌ [PIX-PROD] Erro ao salvar dados do PIX:', updateError);
      throw updateError;
    }

    console.log('✅ [PIX-PROD] Dados do PIX salvos com sucesso');

    // Log de evento
    await supabase.from('log_eventos_sistema').insert({
      tipo_evento: 'PIX_GERADO_PRODUCAO',
      descricao: `PIX gerado com sucesso (PRODUÇÃO): pedido=${pedidoId}, paymentId=${paymentId}, valor=R$${pedido.valor_total}`
    });

    return new Response(
      JSON.stringify({
        success: true,
        qrCodeBase64,
        qrCode,
        paymentId,
        status: 'pending',
        expiresAt
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [PIX-PROD] Erro:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao processar pagamento PIX'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
