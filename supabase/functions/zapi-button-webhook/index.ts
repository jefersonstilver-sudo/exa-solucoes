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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('📨 Webhook received:', JSON.stringify(payload, null, 2));

    // Check if this is a button response
    if (payload.buttonsResponseMessage) {
      const { buttonId, message } = payload.buttonsResponseMessage;
      const phone = payload.phone || payload.from;
      const senderName = payload.senderName || payload.pushName || 'Desconhecido';
      const referenceMessageId = payload.referenceMessageId || payload.messageId;

      console.log('🔘 Button click detected:', { buttonId, message, phone, senderName });

      // Try to find the button in our database
      let buttonRecord = null;
      if (buttonId) {
        const { data: btn } = await supabase
          .from('panel_offline_alert_buttons')
          .select('*')
          .eq('id', buttonId)
          .single();
        buttonRecord = btn;
      }

      // Find recent alert for this phone to link confirmation
      const { data: recentAlerts } = await supabase
        .from('panel_offline_alerts_history')
        .select('*, devices(id, name)')
        .order('sent_at', { ascending: false })
        .limit(10);

      // Try to match by recipient phone
      let matchedAlert = null;
      let deviceInfo = null;

      if (recentAlerts) {
        for (const alert of recentAlerts) {
          // Check if this phone was a recipient
          const recipients = alert.recipients || [];
          const phoneClean = phone?.replace(/\D/g, '');
          
          for (const recipient of recipients) {
            const recipientClean = recipient.phone?.replace(/\D/g, '');
            if (recipientClean && phoneClean && recipientClean.includes(phoneClean.slice(-8))) {
              matchedAlert = alert;
              deviceInfo = alert.devices;
              break;
            }
          }
          if (matchedAlert) break;
        }
      }

      // Insert confirmation record
      const { data: confirmation, error: insertError } = await supabase
        .from('panel_offline_alert_confirmations')
        .insert({
          alert_history_id: matchedAlert?.id || null,
          device_id: deviceInfo?.id || null,
          device_name: deviceInfo?.name || matchedAlert?.device_name || 'Painel desconhecido',
          recipient_phone: phone,
          recipient_name: senderName,
          button_id: buttonRecord?.id || buttonId,
          button_label: message || buttonRecord?.label || 'Confirmação',
          reference_message_id: referenceMessageId,
          raw_webhook: payload
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error inserting confirmation:', insertError);
      } else {
        console.log('✅ Confirmation recorded:', confirmation);
      }

      // Send acknowledgment message back
      const { data: agent } = await supabase
        .from('agents')
        .select('zapi_config')
        .eq('key', 'exa_alert')
        .single();

      if (agent?.zapi_config) {
        const zapiConfig = agent.zapi_config as { instance_id: string; token: string; client_token?: string };
        const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

        const ackMessage = `✅ *Confirmação registrada!*\n\n` +
          `👤 ${senderName}\n` +
          `📍 ${deviceInfo?.name || 'Painel'}\n` +
          `🔘 ${message || 'Confirmação'}\n` +
          `⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (zapiClientToken) {
          headers['Client-Token'] = zapiClientToken;
        } else if (zapiConfig.client_token) {
          headers['Client-Token'] = zapiConfig.client_token;
        }

        await fetch(
          `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              phone: phone,
              message: ackMessage
            })
          }
        );

        console.log('📤 Acknowledgment sent to:', phone);
      }

      return new Response(
        JSON.stringify({ success: true, confirmation_id: confirmation?.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Not a button response, just acknowledge
    return new Response(
      JSON.stringify({ success: true, message: 'Not a button response' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
