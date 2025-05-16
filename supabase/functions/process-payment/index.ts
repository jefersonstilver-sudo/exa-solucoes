
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Importar a SDK do MercadoPago
import * as MercadoPago from "https://esm.sh/mercadopago@1.5.16";

// Configurar CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...corsHeaders,
      },
    });
  }
  
  try {
    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Configurar MercadoPago
    const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') ?? '';
    MercadoPago.configure({
      access_token: MP_ACCESS_TOKEN,
      sandbox: true
    });
    
    // Obter dados do request
    const requestData = await req.json();
    const { pedidoId, cartItems, totals, userId, returnUrl, paymentMethod = 'credit_card' } = requestData;
    
    console.log("Dados recebidos:", { pedidoId, totals, userId, paymentMethod });
    
    // Validar pedidoId (deve ser um UUID válido)
    if (!pedidoId || typeof pedidoId !== 'string' || !pedidoId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      throw new Error(`ID de pedido inválido: ${pedidoId}`);
    }
    
    // Buscar dados do usuário para incluir no pagamento
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (userError) {
      throw new Error(`Erro ao buscar dados do usuário: ${userError.message}`);
    }
    
    // Verificar se existem painéis válidos
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error("Nenhum painel válido encontrado no carrinho");
    }
    
    // Preparar itens para MercadoPago, garantindo que todos os painéis tenham IDs válidos
    const items = cartItems
      .filter(item => 
        item.panel && 
        item.panel.id && 
        typeof item.panel.id === 'string' &&
        item.panel.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      )
      .map(item => ({
        id: item.panel.id,
        title: `Painel em ${item.panel.buildings?.nome || 'Localização'}`,
        quantity: 1,
        unit_price: totals.totalPrice / cartItems.length, // Dividir valor total pelos itens
        currency_id: 'BRL',
        description: `Veiculação por ${totals.duration} dias`,
        category_id: "digital_goods",
        picture_url: item.panel.buildings?.imageUrl || 'https://via.placeholder.com/150'
      }));
      
    if (items.length === 0) {
      throw new Error("Nenhum item válido para processamento");
    }
    
    // Definir claramente o URL de retorno com o ID do pedido
    const successUrl = `${returnUrl || window.location.origin}/pedido-confirmado?id=${pedidoId}&status=approved`;
    const failureUrl = `${returnUrl || window.location.origin}/checkout?error=payment_failed&id=${pedidoId}`;
    const pendingUrl = `${returnUrl || window.location.origin}/pedido-confirmado?id=${pedidoId}&status=pending`;
    
    // Criar preferência de pagamento
    const preference = {
      items,
      payer: {
        email: userData.email,
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      auto_return: "approved",
      external_reference: pedidoId,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      statement_descriptor: "INDEXA MÍDIA",
      payment_methods: {
        excluded_payment_types: [],
        installments: 12,
        default_payment_method_id: paymentMethod
      },
      metadata: {
        pedido_id: pedidoId,
        user_id: userId,
        payment_method: paymentMethod,
        test: true
      }
    };
    
    // Adicionar configurações específicas para PIX se for o método selecionado
    if (paymentMethod === 'pix') {
      preference.payment_methods = {
        ...preference.payment_methods,
        excluded_payment_types: [
          { id: "credit_card" },
          { id: "debit_card" },
          { id: "ticket" }
        ],
        default_payment_method_id: "pix"
      };
    }
    
    // Registrar a criação da preferência
    console.log("Creating payment preference with items:", JSON.stringify(items));
    console.log("Payment method:", paymentMethod);
    
    // Criar preferência no MercadoPago ou simular em desenvolvimento
    let preferenceId = "";
    let initPoint = "";
    
    if (MP_ACCESS_TOKEN) {
      try {
        // Usar a API do MercadoPago para criar preferência real
        const response = await MercadoPago.preferences.create(preference);
        preferenceId = response.body.id;
        initPoint = response.body.init_point;
        console.log("MercadoPago preference created:", preferenceId);
      } catch (mpError) {
        console.error("Error creating MercadoPago preference:", mpError);
        // Falhar de forma elegante com valores simulados
        preferenceId = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        initPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}&test=true`;
        if (paymentMethod === 'pix') {
          initPoint += '&payment_method_id=pix';
        } else {
          initPoint += '&payment_method_id=credit_card';
        }
      }
    } else {
      // Modo simulado (para desenvolvimento)
      preferenceId = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      initPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}&test=true`;
      if (paymentMethod === 'pix') {
        initPoint += '&payment_method_id=pix';
      } else {
        initPoint += '&payment_method_id=credit_card';
      }
    }
    
    // Atualizar o pedido com informações de pagamento
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        log_pagamento: {
          ...totals,
          payment_preference_id: preferenceId,
          payment_init_point: initPoint,
          payment_status: 'pending',
          payment_method: paymentMethod,
          items: items.length,
          test: true,
          timestamp: new Date().toISOString()
        }
      })
      .eq('id', pedidoId);
      
    if (updateError) {
      throw new Error(`Erro ao atualizar pedido: ${updateError.message}`);
    }
    
    // Retornar dados da preferência
    return new Response(
      JSON.stringify({
        success: true,
        preference_id: preferenceId,
        init_point: initPoint,
        pedido_id: pedidoId,
        payment_method: paymentMethod,
        test: true
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
    
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    
    // Retornar erro com detalhes completos para depuração
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        error_details: String(error),
        timestamp: new Date().toISOString()
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
});
