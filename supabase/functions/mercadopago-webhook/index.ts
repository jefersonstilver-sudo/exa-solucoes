
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// CORS headers for browser requests
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
    // Create Supabase client with admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get MercadoPago secret for webhook validation
    const mpWebhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET') || '';
    
    // Extract the data from webhook
    const data = await req.json();
    
    // Log webhook data immediately for debugging
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        origem: 'mercadopago_webhook',
        status: 'received',
        payload: data,
        recebido_em: new Date().toISOString()
      });
    
    if (logError) {
      console.error("Error logging webhook:", logError);
    }
    
    // Validate the webhook data
    if (!data.action || !data.data || !data.data.id) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook payload' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    // Process the payment if it's a payment event
    if (data.action === 'payment.updated' || data.action === 'payment.created') {
      await processPayment(supabase, data.data.id);
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

// Process the payment notification
async function processPayment(supabase, paymentId) {
  try {
    // Get MercadoPago access token from environment variables
    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    
    if (!mercadoPagoToken) {
      throw new Error('MercadoPago access token not configured');
    }
    
    // Fetch payment details from MercadoPago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${mercadoPagoToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch payment details: ${response.statusText}`);
    }
    
    const paymentData = await response.json();
    
    // Extract external reference (contains pedido ID)
    const externalReference = paymentData.external_reference;
    if (!externalReference || !externalReference.includes('CLIENTE')) {
      throw new Error(`Invalid external reference: ${externalReference}`);
    }
    
    // Parse pedidoId from external reference format CLIENTE{pedido_id}/{user_id}
    const pedidoIdMatch = externalReference.match(/CLIENTE([^/]+)\//);
    if (!pedidoIdMatch || !pedidoIdMatch[1]) {
      throw new Error(`Cannot extract pedido ID from reference: ${externalReference}`);
    }
    
    const pedidoId = pedidoIdMatch[1];
    
    // Get payment status
    const paymentStatus = paymentData.status;
    
    // Update pedido status based on payment status
    let pedidoStatus;
    switch (paymentStatus) {
      case 'approved':
        pedidoStatus = 'pago';
        break;
      case 'rejected':
        pedidoStatus = 'cancelado';
        break;
      case 'pending':
      case 'in_process':
        pedidoStatus = 'pendente';
        break;
      default:
        pedidoStatus = 'pendente';
    }
    
    // Find the pedido
    const { data: pedidos, error: findError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .limit(1);
    
    if (findError) {
      throw findError;
    }
    
    if (!pedidos || pedidos.length === 0) {
      throw new Error(`No pedido found with ID: ${pedidoId}`);
    }
    
    const pedido = pedidos[0];
    
    // Update pedido payment information
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        status: pedidoStatus,
        log_pagamento: {
          ...(pedido.log_pagamento || {}),
          payment_id: paymentData.id,
          payment_status: paymentStatus,
          payment_updated_at: new Date().toISOString(),
          pix_data: {
            ...(pedido.log_pagamento?.pix_data || {}),
            status: paymentStatus,
            status_detail: paymentData.status_detail
          }
        }
      })
      .eq('id', pedidoId);
      
    if (updateError) {
      throw updateError;
    }
    
    // Log the payment update
    await supabase
      .from('webhook_logs')
      .insert({
        origem: 'payment_status_update',
        status: 'success',
        payload: {
          pedido_id: pedidoId,
          payment_id: paymentData.id,
          old_status: pedido.log_pagamento?.payment_status || 'unknown',
          new_status: paymentStatus,
          pedido_status: pedidoStatus
        }
      });
    
    // If payment is approved, create campaigns
    if (paymentStatus === 'approved') {
      await createCampaignsFromPedido(supabase, pedido);
    }
    
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
    
    // Determine video status
    const videoId = videos && videos.length > 0 ? videos[0].id : null;
    const campaignStatus = videoId ? 'pendente' : 'aguardando_video';
    
    // Ensure all panel IDs are valid UUIDs
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
    
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campanhas')
      .insert(campaignInserts)
      .select();
      
    if (campaignsError) {
      throw campaignsError;
    }
    
    // Log the action
    await supabase
      .from('webhook_logs')
      .insert({
        origem: 'campaigns_creation',
        status: 'success',
        payload: {
          pedido_id: pedido.id,
          client_id: pedido.client_id,
          campaign_ids: campaigns.map(c => c.id),
          campaign_count: campaigns.length
        }
      });
    
    return campaigns;
  } catch (error) {
    console.error('Error creating campaigns from pedido:', error);
    
    // Log the error but don't throw to prevent webhook failure
    await supabase
      .from('webhook_logs')
      .insert({
        origem: 'campaigns_creation_error',
        status: 'error',
        payload: {
          pedido_id: pedido.id,
          client_id: pedido.client_id,
          error: error.message
        }
      });
  }
}
