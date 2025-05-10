
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase, logUserAction } from '../../../services/supabase';

// Mercado Pago webhook handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests for webhooks
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Extract the data from the webhook
    const data = req.body;
    
    // Validate the webhook data
    if (!data.action || !data.data || !data.data.id) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }
    
    // Log the webhook
    await logWebhook(data, 'mercado_pago');
    
    // Process the payment if it's a payment.updated or payment.created event
    if (data.action === 'payment.updated' || data.action === 'payment.created') {
      await processPayment(data.data.id);
    }
    
    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Error processing webhook' });
  }
}

// Log the webhook to the database
async function logWebhook(payload: any, origem: string) {
  try {
    await supabase
      .from('webhook_logs')
      .insert([
        {
          origem,
          status: 'received',
          payload,
          recebido_em: new Date().toISOString()
        }
      ]);
  } catch (error) {
    console.error('Error logging webhook:', error);
  }
}

// Process the payment
async function processPayment(paymentId: string) {
  try {
    // Find the pedido with this payment_id in the log_pagamento field
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .filter('log_pagamento->payment_id', 'eq', paymentId)
      .limit(1);
      
    if (error) {
      throw error;
    }
    
    if (!pedidos || pedidos.length === 0) {
      console.log('No pedido found for payment ID:', paymentId);
      return;
    }
    
    const pedido = pedidos[0];
    
    // Update the pedido status to 'pago'
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({ status: 'pago' })
      .eq('id', pedido.id);
      
    if (updateError) {
      throw updateError;
    }
    
    // Log the action
    await logUserAction(
      pedido.client_id,
      'payment_confirmed',
      { pedido_id: pedido.id, payment_id: paymentId }
    );
    
    // After payment is confirmed, create campaigns for selected painels
    await createCampaignsFromPedido(pedido);
    
  } catch (error) {
    console.error('Error processing payment:', error);
  }
}

// Create campaigns from pedido
async function createCampaignsFromPedido(pedido: any) {
  try {
    // Get client's active video
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .eq('client_id', pedido.client_id)
      .eq('status', 'ativo')
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (videosError || !videos || videos.length === 0) {
      console.log('No active video found for client:', pedido.client_id);
      return;
    }
    
    const video = videos[0];
    
    // Calculate campaign dates
    const startDate = new Date().toISOString().split('T')[0]; // today
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + pedido.duracao);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Create a campaign for each painel in the pedido
    const campaignInserts = pedido.lista_paineis.map((painelId: string) => ({
      client_id: pedido.client_id,
      video_id: video.id,
      painel_id: painelId,
      data_inicio: startDate,
      data_fim: endDateStr,
      obs: `Created from pedido ${pedido.id}`,
      status: 'pendente'
    }));
    
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campanhas')
      .insert(campaignInserts)
      .select();
      
    if (campaignsError) {
      throw campaignsError;
    }
    
    // Log the action
    await logUserAction(
      pedido.client_id,
      'campaigns_created_from_pedido',
      { 
        pedido_id: pedido.id, 
        campaign_ids: campaigns.map((c: any) => c.id) 
      }
    );
    
  } catch (error) {
    console.error('Error creating campaigns from pedido:', error);
  }
}
