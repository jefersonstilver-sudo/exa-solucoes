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
    console.log('📨 [BUTTON-WEBHOOK] Received:', JSON.stringify(payload, null, 2));

    // Z-API sends button responses in TWO different formats:
    // 1. buttonsResponseMessage (older format)
    // 2. buttonReply (newer format)
    const buttonData = payload.buttonsResponseMessage || payload.buttonReply;
    
    if (!buttonData) {
      console.log('ℹ️ [BUTTON-WEBHOOK] Not a button response, ignoring');
      return new Response(
        JSON.stringify({ success: true, message: 'Not a button response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { buttonId, message } = buttonData;
    const phone = payload.phone || payload.from;
    const senderName = payload.senderName || payload.chatName || payload.pushName || 'Desconhecido';
    const referenceMessageId = buttonData.referenceMessageId || payload.referenceMessageId || payload.messageId;

    console.log('🔘 [BUTTON-WEBHOOK] Button click detected:', { 
      buttonId, 
      message, 
      phone, 
      senderName,
      referenceMessageId 
    });

    // Try to find the button in our database
    let buttonRecord = null;
    if (buttonId) {
      const { data: btn } = await supabase
        .from('panel_offline_alert_buttons')
        .select('*')
        .eq('id', buttonId)
        .single();
      buttonRecord = btn;
      console.log('🔍 [BUTTON-WEBHOOK] Button record found:', buttonRecord ? 'yes' : 'no');
    }

    // Find recent alert for this phone to link confirmation
    const { data: recentAlerts, error: alertsError } = await supabase
      .from('panel_offline_alerts_history')
      .select('*, devices(id, name)')
      .order('sent_at', { ascending: false })
      .limit(20);

    if (alertsError) {
      console.error('❌ [BUTTON-WEBHOOK] Error fetching alerts:', alertsError);
    }

    console.log('📋 [BUTTON-WEBHOOK] Recent alerts found:', recentAlerts?.length || 0);

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
          // Match last 8 digits of phone
          if (recipientClean && phoneClean && 
              (recipientClean.includes(phoneClean.slice(-8)) || phoneClean.includes(recipientClean.slice(-8)))) {
            matchedAlert = alert;
            deviceInfo = alert.devices;
            console.log('✅ [BUTTON-WEBHOOK] Matched alert:', { 
              alertId: alert.id, 
              deviceName: deviceInfo?.name 
            });
            break;
          }
        }
        if (matchedAlert) break;
      }
    }

    if (!matchedAlert) {
      console.log('⚠️ [BUTTON-WEBHOOK] No matching alert found for phone:', phone);
    }

    // Insert confirmation record
    const confirmationData = {
      alert_history_id: matchedAlert?.id || null,
      device_id: deviceInfo?.id || matchedAlert?.device_id || null,
      device_name: deviceInfo?.name || matchedAlert?.device_name || 'Painel desconhecido',
      recipient_phone: phone,
      recipient_name: senderName,
      button_id: buttonRecord?.id || buttonId,
      button_label: message || buttonRecord?.label || 'Confirmação',
      reference_message_id: referenceMessageId,
      raw_webhook: payload
    };

    console.log('💾 [BUTTON-WEBHOOK] Inserting confirmation:', confirmationData);

    const { data: confirmation, error: insertError } = await supabase
      .from('panel_offline_alert_confirmations')
      .insert(confirmationData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ [BUTTON-WEBHOOK] Error inserting confirmation:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ [BUTTON-WEBHOOK] Confirmation recorded:', confirmation.id);

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
        `📍 ${deviceInfo?.name || matchedAlert?.device_name || 'Painel'}\n` +
        `🔘 ${message || 'Confirmação'}\n` +
        `⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (zapiClientToken) {
        headers['Client-Token'] = zapiClientToken;
      } else if (zapiConfig.client_token) {
        headers['Client-Token'] = zapiConfig.client_token;
      }

      try {
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
        console.log('📤 [BUTTON-WEBHOOK] Acknowledgment sent to:', phone);
      } catch (ackError) {
        console.error('⚠️ [BUTTON-WEBHOOK] Error sending ack:', ackError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, confirmation_id: confirmation?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [BUTTON-WEBHOOK] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
