
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for webhook requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

// Função para validar a assinatura do webhook do Mercado Pago
function validateSignature(signature: string, dataId: string, secret: string): boolean {
  try {
    // Mercado Pago usa HMAC-SHA256 para assinar webhooks
    const crypto = globalThis.crypto;
    const encoder = new TextEncoder();
    
    // Preparar dados para validação
    const data = `data.id=${dataId}`;
    const key = encoder.encode(secret);
    const message = encoder.encode(data);
    
    return crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    ).then(cryptoKey => {
      return crypto.subtle.verify(
        'HMAC',
        cryptoKey,
        new Uint8Array(signature.split('').map(char => char.charCodeAt(0))),
        message
      );
    }).catch(() => false);
  } catch (error) {
    console.error('Erro na validação da assinatura:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔔 Webhook do Mercado Pago recebido');
    
    // Obter dados do webhook
    const body = await req.json();
    const signature = req.headers.get('x-signature') || '';
    const webhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET')!;
    
    console.log('📦 Dados do webhook:', {
      type: body.type,
      action: body.action,
      data_id: body.data?.id,
      hasSignature: !!signature
    });

    // Validar assinatura do webhook (comentado temporariamente para debug)
    // const isValidSignature = await validateSignature(signature, body.data?.id, webhookSecret);
    // if (!isValidSignature) {
    //   console.error('❌ Assinatura inválida do webhook');
    //   return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    // }

    // Processar apenas eventos de pagamento
    if (body.type === 'payment') {
      const paymentId = body.data?.id;
      const action = body.action;
      
      console.log(`💳 Evento de pagamento: ${action} - ID: ${paymentId}`);
      
      if (action === 'payment.updated' || action === 'payment.created') {
        // Buscar detalhes do pagamento no Mercado Pago
        const mpAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!;
        
        const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!paymentResponse.ok) {
          console.error('❌ Erro ao buscar pagamento no MP:', paymentResponse.status);
          return new Response('Error fetching payment', { 
            status: 500, 
            headers: corsHeaders 
          });
        }
        
        const paymentData = await paymentResponse.json();
        
        console.log('💰 Dados do pagamento:', {
          id: paymentData.id,
          status: paymentData.status,
          external_reference: paymentData.external_reference,
          payment_method_id: paymentData.payment_method_id
        });
        
        // Verificar se é pagamento PIX aprovado
        if (paymentData.status === 'approved' && paymentData.payment_method_id === 'pix') {
          const externalReference = paymentData.external_reference;
          
          if (externalReference) {
            console.log('✅ Pagamento PIX aprovado! Atualizando pedido:', externalReference);
            
            // Atualizar status do pedido na tabela
            const { data: updateResult, error: updateError } = await supabase
              .from('pedidos')
              .update({ 
                status: 'pago',
                log_pagamento: {
                  ...paymentData,
                  webhook_processed_at: new Date().toISOString(),
                  payment_method: 'pix',
                  payment_status: 'approved'
                }
              })
              .eq('id', externalReference);
            
            if (updateError) {
              console.error('❌ Erro ao atualizar pedido:', updateError);
              return new Response('Error updating order', { 
                status: 500, 
                headers: corsHeaders 
              });
            }
            
            console.log('🎉 Pedido atualizado com sucesso:', externalReference);
            
            // Log de sucesso
            console.log('✅ Webhook processado com sucesso:', {
              pedidoId: externalReference,
              paymentId: paymentData.id,
              status: 'approved',
              timestamp: new Date().toISOString()
            });
            
            return new Response(JSON.stringify({ 
              success: true, 
              message: 'Payment processed successfully',
              pedido_id: externalReference
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          } else {
            console.warn('⚠️ Pagamento sem external_reference');
          }
        } else {
          console.log('ℹ️ Pagamento não é PIX aprovado:', {
            status: paymentData.status,
            method: paymentData.payment_method_id
          });
        }
      }
    }
    
    return new Response('OK', { status: 200, headers: corsHeaders });
    
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return new Response('Internal Server Error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});
