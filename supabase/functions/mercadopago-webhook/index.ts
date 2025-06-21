
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData = await req.json();
    
    console.log("🔔 [MercadoPago Webhook] Recebido:", {
      type: webhookData.type,
      action: webhookData.action,
      data_id: webhookData.data?.id
    });

    // Processar webhook usando a função do banco
    const { data, error } = await supabase.rpc('process_mercadopago_webhook', {
      webhook_data: webhookData
    });

    if (error) {
      throw error;
    }

    console.log("✅ [MercadoPago Webhook] Processado:", data);

    // Se pagamento foi confirmado, criar notificação para o usuário
    if (data.success && data.pedido_id) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: (await supabase
            .from('pedidos')
            .select('client_id')
            .eq('id', data.pedido_id)
            .single()
          ).data?.client_id,
          title: 'Pagamento Confirmado!',
          message: 'Seu pagamento PIX foi confirmado. Agora você pode enviar seu vídeo.',
          type: 'success',
          metadata: {
            pedido_id: data.pedido_id,
            payment_method: 'pix'
          }
        });

      if (notificationError) {
        console.error("⚠️ [MercadoPago Webhook] Erro ao criar notificação:", notificationError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error("❌ [MercadoPago Webhook] Erro:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
