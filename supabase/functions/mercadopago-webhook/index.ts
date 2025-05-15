
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse webhook data
    const data = await req.json();
    
    // Log webhook for debugging
    await logWebhook(supabase, data, 'mercadopago_webhook');
    
    // Process payment notification if applicable
    if (data.action === 'payment.updated' || data.action === 'payment.created') {
      await processPayment(supabase, data);
    }
    
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
      JSON.stringify({ error: error.message }),
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

// Log webhook to database
async function logWebhook(supabase, payload, origem = 'mercadopago_webhook') {
  try {
    await supabase
      .from('webhook_logs')
      .insert({
        origem,
        status: 'received',
        payload,
        recebido_em: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging webhook:', error);
  }
}

// Process payment
async function processPayment(supabase, webhookData) {
  try {
    // Fetch the MP public access token to get payment details
    const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') ?? '';
    
    // Extract data from webhook
    const paymentId = webhookData.data?.id;
    if (!paymentId) {
      throw new Error('Payment ID not found in webhook data');
    }
    
    // In a real implementation, you'd fetch payment details from MercadoPago API
    // For now, we'll simulate with data from the webhook
    let paymentStatus = 'pending';
    let externalReference = '';
    
    if (webhookData.data && webhookData.data.id) {
      // Try to get external reference from webhook data or fetch from MP API
      if (MP_ACCESS_TOKEN) {
        // Here would be the code to fetch from MercadoPago API
        // For simulation, we'll use values from webhook data if available
        if (webhookData.metadata?.external_reference) {
          externalReference = webhookData.metadata.external_reference;
        }
        
        if (webhookData.status) {
          paymentStatus = webhookData.status;
        }
      } else {
        // Simulate for development
        externalReference = `test-order-${Date.now()}`;
        paymentStatus = 'approved'; // Default to approved for testing
      }
    }
    
    // If no external reference found, try to find the pedido by payment_preference_id
    if (!externalReference) {
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*')
        .like('log_pagamento->payment_preference_id', `%${paymentId}%`)
        .limit(1);
        
      if (!error && pedidos?.length > 0) {
        externalReference = pedidos[0].id;
      } else {
        throw new Error('Unable to find related order for payment');
      }
    }
    
    // Find the pedido using external reference (pedido ID)
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', externalReference)
      .limit(1);
      
    if (error) {
      throw error;
    }
    
    if (!pedidos || pedidos.length === 0) {
      throw new Error('No pedido found for external reference: ' + externalReference);
    }
    
    const pedido = pedidos[0];
    
    // Update pedido status based on payment status
    let pedidoStatus = 'pendente';
    if (paymentStatus === 'approved') {
      pedidoStatus = 'pago';
    } else if (paymentStatus === 'rejected') {
      pedidoStatus = 'cancelado';
    }
    
    // Update the pedido with payment details
    const paymentUpdate = {
      status: pedidoStatus,
      log_pagamento: {
        ...(pedido.log_pagamento || {}),
        payment_id: paymentId,
        payment_status: paymentStatus,
        payment_updated_at: new Date().toISOString()
      }
    };
    
    const { error: updateError } = await supabase
      .from('pedidos')
      .update(paymentUpdate)
      .eq('id', pedido.id);
      
    if (updateError) {
      throw updateError;
    }
    
    // If payment approved, create campaigns
    if (paymentStatus === 'approved') {
      await createCampaignsFromPedido(supabase, pedido);
    }
    
    // Log the action
    await logUserAction(
      supabase,
      pedido.client_id,
      'payment_processed',
      { 
        pedido_id: pedido.id, 
        payment_id: paymentId,
        payment_status: paymentStatus
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
}

// Create campaigns from pedido
async function createCampaignsFromPedido(supabase, pedido) {
  try {
    // Get client's active video
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .eq('client_id', pedido.client_id)
      .eq('status', 'ativo')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (videosError) {
      throw videosError;
    }
    
    // Determine if client has an active video
    const videoId = videos && videos.length > 0 ? videos[0].id : null;
    const campaignStatus = videoId ? 'pendente' : 'aguardando_video';
    
    // Filter valid panel IDs
    const validPanelIds = pedido.lista_paineis.filter(id => 
      id && typeof id === 'string' && id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    );
    
    if (validPanelIds.length === 0) {
      throw new Error('No valid panel IDs found in pedido');
    }
    
    // Create a campaign for each painel in the pedido
    const campaignInserts = validPanelIds.map(painelId => ({
      client_id: pedido.client_id,
      video_id: videoId,
      painel_id: painelId,
      data_inicio: pedido.data_inicio,
      data_fim: pedido.data_fim,
      status: campaignStatus,
      obs: `Criado a partir do pedido ${pedido.id}`,
      proveniencia_video: 'cliente',
      ultima_atualizacao: new Date().toISOString()
    }));
    
    // Insert campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campanhas')
      .insert(campaignInserts)
      .select();
      
    if (campaignsError) {
      throw campaignsError;
    }
    
    // Log the action
    await logUserAction(
      supabase,
      pedido.client_id,
      'campaigns_created_from_pedido',
      { 
        pedido_id: pedido.id, 
        campaign_ids: campaigns.map(c => c.id) 
      }
    );
    
    return campaigns;
  } catch (error) {
    console.error('Error creating campaigns from pedido:', error);
    throw error;
  }
}

// Log user action
async function logUserAction(supabase, userId, action, details) {
  try {
    await supabase
      .from('webhook_logs')
      .insert({
        origem: 'user_action',
        status: 'success',
        payload: {
          user_id: userId,
          action,
          details,
          timestamp: new Date().toISOString()
        }
      });
  } catch (error) {
    console.error('Error logging user action:', error);
  }
}
