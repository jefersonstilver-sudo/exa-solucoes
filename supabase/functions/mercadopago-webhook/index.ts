
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
    
    // Log webhook for debugging with more detail
    await logWebhook(supabase, {
      ...data,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url,
      method: req.method,
    }, 'mercadopago_webhook');
    
    // Verify webhook signature (in production, implement proper verification)
    const isValidWebhook = verifyWebhook(req);
    if (!isValidWebhook) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
    
    // Process payment notification if applicable
    if (data.action === 'payment.updated' || data.action === 'payment.created') {
      await processPayment(supabase, data.data.id, data);
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

// Function to verify webhook authenticity (placeholder for now)
function verifyWebhook(req: Request): boolean {
  // In production, you would verify the signature using the Mercado Pago webhook secret
  // For now, we'll accept all webhooks
  return true;
}

// Log webhook to database with enhanced data
async function logWebhook(supabase, payload, origem = 'mercadopago_webhook') {
  try {
    await supabase
      .from('webhook_logs')
      .insert({
        origem,
        status: 'received',
        payload,
        recebido_em: new Date().toISOString(),
        metadata: {
          ip: payload.headers['x-forwarded-for'] || 'unknown',
          user_agent: payload.headers['user-agent'] || 'unknown'
        }
      });
  } catch (error) {
    console.error('Error logging webhook:', error);
  }
}

// Process payment with better error handling and logging
async function processPayment(supabase, paymentId, webhookData) {
  try {
    console.log(`Processing payment ${paymentId}`);
    
    // Fetch the MP access token to get payment details
    const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') ?? '';
    
    // In production, fetch the payment details from Mercado Pago API
    // For now, extract info from webhook data or use placeholders
    let paymentStatus = 'approved'; // Default for testing
    let externalReference = null;
    
    // Try to get external reference from the webhook data
    if (webhookData?.data?.external_reference) {
      externalReference = webhookData.data.external_reference;
    } 
    
    // If no external reference in webhook data, try to get it from the payment details
    if (!externalReference) {
      // In a real implementation, you would call the Mercado Pago API to get payment details
      // For now we'll use a placeholder or extract from metadata
      externalReference = webhookData?.data?.metadata?.pedido_id || 'test-reference';
    }
    
    if (!externalReference) {
      throw new Error('No external reference found in payment');
    }
    
    console.log(`Found external reference: ${externalReference}`);
    
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
      console.log('No pedido found for external reference:', externalReference);
      return;
    }
    
    const pedido = pedidos[0];
    console.log(`Found pedido: ${pedido.id} with status ${pedido.status}`);
    
    // Update pedido status based on payment status
    let pedidoStatus = 'pendente';
    if (paymentStatus === 'approved') {
      pedidoStatus = 'pago';
    } else if (paymentStatus === 'rejected') {
      pedidoStatus = 'cancelado';
    }
    
    console.log(`Updating pedido status to: ${pedidoStatus}`);
    
    // Update the pedido with more payment details
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        status: pedidoStatus,
        log_pagamento: {
          ...pedido.log_pagamento,
          payment_id: paymentId,
          payment_status: paymentStatus,
          payment_updated_at: new Date().toISOString(),
          webhook_received: true,
          webhook_data: {
            id: webhookData?.id || null,
            action: webhookData?.action || null,
            date_created: webhookData?.date_created || new Date().toISOString()
          }
        }
      })
      .eq('id', pedido.id);
      
    if (updateError) {
      throw updateError;
    }
    
    // If payment approved, create campaigns
    if (paymentStatus === 'approved') {
      console.log(`Payment approved, creating campaigns for pedido: ${pedido.id}`);
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
    
    console.log(`Payment ${paymentId} successfully processed`);
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
    
    console.log(`Creating ${validPanelIds.length} campaigns for pedido ${pedido.id}`);
    
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
    
    console.log(`Successfully created ${campaigns.length} campaigns`);
    
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
