
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
        payment_id: paymentInfo.id,
        payment_status: 'paid',
        paid_at: new Date().toISOString()
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
    if (order.order_type === 'campaign' && order.client_id) {
      const { error: campaignError } = await supabase
        .from('campanhas')
        .insert([
          {
            client_id: order.client_id,
            video_id: order.video_id || null,
            painel_id: order.painel_id || null,
            data_inicio: new Date().toISOString(),
            data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            status: 'pendente',
            obs: `Campanha criada a partir do pedido #${order.id}`
          }
        ]);
        
      if (campaignError) {
        console.error('Error creating campaign:', campaignError);
      }
    }
    
    // Mark the webhook as processed
    await supabase
      .from('webhook_logs')
      .update({ status: 'processed' })
      .eq('id', paymentInfo.id);
      
  } catch (error) {
    console.error('Error processing payment:', error);
  }
}
