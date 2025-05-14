
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
    
    // Log do webhook recebido
    const bodyText = await req.text();
    let webhookData;
    
    try {
      webhookData = JSON.parse(bodyText);
    } catch (e) {
      webhookData = { raw: bodyText };
    }
    
    // Registrar o webhook no log
    await supabase
      .from('webhook_logs')
      .insert([
        {
          origem: 'mercadopago',
          status: 'received',
          payload: webhookData
        }
      ]);
    
    // Verificar se é uma notificação de pagamento
    if (webhookData.type === 'payment' && webhookData.data && webhookData.data.id) {
      // Buscar pedido pelo external_reference
      const paymentId = webhookData.data.id;
      
      // Simular chamada à API do MercadoPago
      // Em produção, fazer: const payment = await mercadopago.payment.get(paymentId);
      const payment = {
        status: 'approved',
        external_reference: webhookData.data.external_reference || null,
        metadata: webhookData.data.metadata || {}
      };
      
      const pedidoId = payment.external_reference || payment.metadata.pedido_id;
      
      if (!pedidoId) {
        throw new Error('Pedido ID not found in payment data');
      }
      
      // Atualizar status do pedido
      await supabase
        .from('pedidos')
        .update({
          status: payment.status === 'approved' ? 'pago' : payment.status,
          log_pagamento: {
            payment_id: paymentId,
            payment_status: payment.status,
            payment_date: new Date().toISOString(),
            payment_data: payment
          }
        })
        .eq('id', pedidoId);
      
      // Se o pagamento foi aprovado, criar campanhas
      if (payment.status === 'approved') {
        // Buscar informações do pedido
        const { data: pedido, error: pedidoError } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', pedidoId)
          .single();
          
        if (pedidoError) {
          throw new Error(`Error fetching order: ${pedidoError.message}`);
        }
        
        // Criar campanhas para cada painel
        const campanhas = pedido.lista_paineis.map(painelId => ({
          client_id: pedido.client_id,
          painel_id: painelId,
          video_id: '00000000-0000-0000-0000-000000000000', // Placeholder até o cliente enviar o vídeo
          data_inicio: pedido.data_inicio,
          data_fim: pedido.data_fim,
          status: 'aguardando_video',
          proveniencia_video: 'cliente',
          producao_status: null,
          obs: `Campanha criada automaticamente do pedido ${pedidoId}`
        }));
        
        // Inserir campanhas
        await supabase
          .from('campanhas')
          .insert(campanhas);
      }
    }
    
    // Responder ao webhook
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    
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
