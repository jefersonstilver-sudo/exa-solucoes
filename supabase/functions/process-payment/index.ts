
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

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
    
    // Obter dados do request
    const { pedidoId, cartItems, totals, userId, paymentMethod = 'credit_card' } = await req.json();
    
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
        typeof item.panel.id === 'string'
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
    
    // SIMULAÇÃO PARA TESTES: Gerar IDs e URLs fictícias de preferência
    // Isso é uma solução temporária para bypass do MercadoPago
    const preferenceId = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const initPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`;
    
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
          test: true
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
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
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
