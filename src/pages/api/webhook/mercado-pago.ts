
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyWebhookSignature, getPaymentInfo } from '../../../services/mercadoPago';
import { supabase } from '../../../services/supabase';

// Security check that doesn't require authentication as this is a webhook
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify the webhook signature
    if (!verifyWebhookSignature(req)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Log the incoming webhook
    const webhookData = req.body;
    await supabase
      .from('webhook_logs')
      .insert([
        {
          origem: 'mercado_pago',
          payload: webhookData,
          status: 'received'
        }
      ]);

    // For payment notifications, we need to get payment info
    if (webhookData.type === 'payment' && webhookData.data && webhookData.data.id) {
      const paymentInfo = await getPaymentInfo(webhookData.data.id);
      
      if (paymentInfo && paymentInfo.status === 'approved') {
        // Process the approved payment
        await processApprovedPayment(paymentInfo);
      }
    }

    // Always return 200 to avoid unnecessary retries
    return res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Log the error but still return 200 to MercadoPago
    return res.status(200).json({ message: 'Webhook received with processing error' });
  }
}

// Process an approved payment
async function processApprovedPayment(paymentInfo: any) {
  try {
    // Get metadata from payment
    const { metadata } = paymentInfo;
    
    if (!metadata || !metadata.order_id) {
      console.error('Payment missing order ID in metadata');
      return;
    }
    
    // Update the order status
    const { error: orderUpdateError } = await supabase
      .from('pedidos')
      .update({
        log_pagamento: paymentInfo,
        status: 'paid'
      })
      .eq('id', metadata.order_id);
      
    if (orderUpdateError) {
      console.error('Error updating order:', orderUpdateError);
      return;
    }
    
    // Get order data to create campaign if needed
    const { data: order, error: orderError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', metadata.order_id)
      .single();
      
    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return;
    }
    
    // Create campaign from order if required
    // Since we don't have 'order_type' or 'video_id' fields in the pedidos table,
    // we'll need to adapt this logic to work with our schema
    if (order.client_id) {
      // Assuming we're creating a campaign for each painel in the lista_paineis array
      for (const painelId of order.lista_paineis) {
        // Get a default video for this client to use in the campaign
        const { data: clientVideos, error: videoError } = await supabase
          .from('videos')
          .select('id')
          .eq('client_id', order.client_id)
          .eq('status', 'ativo')
          .limit(1);
          
        if (videoError || !clientVideos || clientVideos.length === 0) {
          console.error('No video found for client:', order.client_id);
          continue;
        }
        
        const videoId = clientVideos[0].id;
        
        // Calculate dates for the campaign based on order duration
        const startDate = new Date().toISOString().split('T')[0]; // Start today
        const endDate = new Date(Date.now() + order.duracao * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // End after duration days
        
        const { error: campaignError } = await supabase
          .from('campanhas')
          .insert([
            {
              client_id: order.client_id,
              painel_id: painelId,
              data_inicio: startDate,
              data_fim: endDate, 
              status: 'pendente',
              obs: `Campanha criada a partir do pedido #${order.id}`,
              video_id: videoId
            }
          ]);
          
        if (campaignError) {
          console.error('Error creating campaign:', campaignError);
        }
      }
    }
    
    // Mark the webhook as processed
    await supabase
      .from('webhook_logs')
      .update({ status: 'processed' })
      .eq('origem', 'mercado_pago')
      .eq('payload->data->id', paymentInfo.id);
      
  } catch (error) {
    console.error('Error processing payment:', error);
  }
}
