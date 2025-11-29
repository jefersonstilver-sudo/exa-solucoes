import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { pedidoId } = await req.json();

    console.log('🔄 [GENERATE-PIX] Gerando PIX para pedido:', pedidoId);

    if (!pedidoId) {
      throw new Error('ID do pedido é obrigatório');
    }

    // Buscar pedido
    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !pedido) {
      console.error('❌ [GENERATE-PIX] Pedido não encontrado:', pedidoError);
      throw new Error('Pedido não encontrado');
    }

    // Verificar se o pedido está pendente
    if (pedido.status !== 'pendente') {
      console.log('⚠️ [GENERATE-PIX] Pedido não está pendente:', pedido.status);
      throw new Error(`Pedido já está com status: ${pedido.status}`);
    }

    // Verificar se já existe um PIX gerado para este pedido
    const { data: existingPix, error: pixError } = await supabaseAdmin
      .from('log_pagamento')
      .select('pix_data')
      .eq('pedido_id', pedidoId)
      .eq('payment_method', 'pix')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Se já existe PIX gerado, retornar os dados existentes
    if (existingPix && existingPix.pix_data) {
      console.log('✅ [GENERATE-PIX] PIX já existente encontrado');
      return new Response(
        JSON.stringify({
          success: true,
          pixData: {
            qrCodeBase64: existingPix.pix_data.qr_code_base64,
            qrCode: existingPix.pix_data.qr_code,
            paymentId: existingPix.pix_data.payment_id,
            status: 'pending'
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Gerar novo PIX via MercadoPago
    const mercadoPagoToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!mercadoPagoToken) {
      throw new Error('Token do MercadoPago não configurado');
    }

    const paymentData = {
      transaction_amount: pedido.valor_total,
      description: `Pedido #${pedidoId.substring(0, 8)}`,
      payment_method_id: "pix",
      payer: {
        email: pedido.client_email || "cliente@example.com",
        first_name: pedido.client_name || "Cliente",
      },
    };

    console.log('💳 [GENERATE-PIX] Criando pagamento no MercadoPago...');

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mercadoPagoToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('❌ [GENERATE-PIX] Erro MercadoPago:', errorText);
      throw new Error(`Erro ao criar pagamento: ${errorText}`);
    }

    const paymentResult = await mpResponse.json();

    console.log('✅ [GENERATE-PIX] Pagamento criado:', paymentResult.id);

    const pixData = {
      qr_code_base64: paymentResult.point_of_interaction?.transaction_data?.qr_code_base64,
      qr_code: paymentResult.point_of_interaction?.transaction_data?.qr_code,
      payment_id: paymentResult.id,
    };

    // Salvar no log_pagamento
    const { error: logError } = await supabaseAdmin
      .from('log_pagamento')
      .insert({
        pedido_id: pedidoId,
        payment_method: 'pix',
        payment_id: paymentResult.id,
        payment_status: paymentResult.status,
        preference_id: null,
        pix_data: pixData,
      });

    if (logError) {
      console.error('⚠️ [GENERATE-PIX] Erro ao salvar log:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        pixData: {
          qrCodeBase64: pixData.qr_code_base64,
          qrCode: pixData.qr_code,
          paymentId: pixData.payment_id,
          status: 'pending'
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("❌ [GENERATE-PIX] Erro:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro ao gerar PIX'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
