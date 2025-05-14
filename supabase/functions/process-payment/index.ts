
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
      access_token: MP_ACCESS_TOKEN
    });
    
    // Obter dados do request
    const { pedidoId, cartItems, totals, userId, returnUrl } = await req.json();
    
    // Buscar dados do usuário para incluir no pagamento
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
      
    if (userError) {
      throw new Error(`Error fetching user data: ${userError.message}`);
    }
    
    // Preparar itens para MercadoPago
    const items = cartItems.map(item => ({
      id: item.panel.id,
      title: `Painel em ${item.panel.buildings?.nome || 'Localização'}`,
      quantity: 1,
      unit_price: totals.totalPrice / cartItems.length, // Dividir valor total pelos itens
      currency_id: 'BRL',
      description: `Veiculação por ${totals.duration} dias`,
      category_id: "digital_goods",
      picture_url: item.panel.buildings?.imageUrl || 'https://via.placeholder.com/150'
    }));
    
    // Criar preferência de pagamento
    const preference = {
      items,
      payer: {
        email: userData.email,
      },
      back_urls: {
        success: `${returnUrl}/pedido-confirmado?id=${pedidoId}&status=approved`,
        failure: `${returnUrl}/pedido-confirmado?id=${pedidoId}&status=rejected`,
        pending: `${returnUrl}/pedido-confirmado?id=${pedidoId}&status=pending`
      },
      auto_return: "approved",
      external_reference: pedidoId,
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      statement_descriptor: "INDEXA MÍDIA",
      metadata: {
        pedido_id: pedidoId,
        user_id: userId
      }
    };
    
    // Registrar a criação da preferência
    console.log("Creating payment preference with items:", JSON.stringify(items));
    
    // Criar preferência no MercadoPago (versão simulada para teste)
    // Em produção, usar: const response = await MercadoPago.preferences.create(preference);
    const mockPreferenceId = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const mockInitPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${mockPreferenceId}`;
    
    // Atualizar o pedido com informações de pagamento
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        log_pagamento: {
          ...totals,
          payment_preference_id: mockPreferenceId,
          payment_init_point: mockInitPoint,
          payment_status: 'pending',
          items: items.length
        }
      })
      .eq('id', pedidoId);
      
    if (updateError) {
      throw new Error(`Error updating order: ${updateError.message}`);
    }
    
    // Retornar dados da preferência
    return new Response(
      JSON.stringify({
        success: true,
        preference_id: mockPreferenceId,
        init_point: mockInitPoint,
        pedido_id: pedidoId
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
    
  } catch (error) {
    console.error('Error processing payment:', error);
    
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
