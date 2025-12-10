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

    const buttonData = payload.buttonsResponseMessage || payload.buttonReply;
    
    if (!buttonData) {
      return new Response(
        JSON.stringify({ success: true, message: 'Not a button response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { buttonId, message } = buttonData;
    const phone = payload.phone || payload.from;
    const senderName = payload.senderName || payload.chatName || payload.pushName || 'Desconhecido';
    const referenceMessageId = buttonData.referenceMessageId || payload.referenceMessageId || payload.messageId;
    const buttonLabel = message || '';

    console.log('🔘 [BUTTON-WEBHOOK] Button click:', { buttonId, buttonLabel, phone, senderName });

    // Find button record
    let buttonRecord = null;
    if (buttonId) {
      const { data: btn } = await supabase
        .from('panel_offline_alert_buttons')
        .select('*')
        .eq('id', buttonId)
        .single();
      buttonRecord = btn;
    }

    // Find recent alert for this phone
    const { data: recentAlerts } = await supabase
      .from('panel_offline_alerts_history')
      .select('*, devices(id, name, metadata)')
      .order('sent_at', { ascending: false })
      .limit(20);

    let matchedAlert = null;
    let deviceInfo = null;

    if (recentAlerts) {
      for (const alert of recentAlerts) {
        const recipients = alert.recipients || [];
        const phoneClean = phone?.replace(/\D/g, '');
        
        for (const recipient of recipients) {
          const recipientClean = recipient.phone?.replace(/\D/g, '');
          if (recipientClean && phoneClean && 
              (recipientClean.includes(phoneClean.slice(-8)) || phoneClean.includes(recipientClean.slice(-8)))) {
            matchedAlert = alert;
            deviceInfo = alert.devices;
            break;
          }
        }
        if (matchedAlert) break;
      }
    }

    const deviceId = deviceInfo?.id || matchedAlert?.painel_id;
    const metadata = deviceInfo?.metadata || {};

    // DETERMINE ACTION BASED ON BUTTON LABEL
    let actionType = 'confirmation';
    let pauseDuration = null;

    if (buttonLabel.toLowerCase().includes('visualizei') || buttonLabel.toLowerCase().includes('👁️')) {
      // "Já Visualizei" - Pause for 3 hours
      actionType = 'pause_3h';
      pauseDuration = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      console.log('⏸️ [BUTTON-WEBHOOK] Pausando notificações por 3 horas');
    } else if (buttonLabel.toLowerCase().includes('interromper') || buttonLabel.toLowerCase().includes('🛑')) {
      // "Interromper Notificações" - Pause indefinitely until online
      actionType = 'pause_indefinite';
      pauseDuration = 'indefinite';
      console.log('🛑 [BUTTON-WEBHOOK] Interrompendo notificações até voltar online');
    }

    // Update device metadata if we have a device and an action to pause
    if (deviceId && pauseDuration) {
      const newMetadata = {
        ...metadata,
        notifications_paused_until: pauseDuration,
        paused_by: phone,
        paused_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('devices')
        .update({ metadata: newMetadata })
        .eq('id', deviceId);

      if (updateError) {
        console.error('❌ [BUTTON-WEBHOOK] Error updating device metadata:', updateError);
      } else {
        console.log('✅ [BUTTON-WEBHOOK] Device metadata updated with pause:', pauseDuration);
      }
    }

    // Insert confirmation record with incident info
    const confirmationData = {
      alert_history_id: matchedAlert?.id || null,
      device_id: deviceId || null,
      device_name: deviceInfo?.name || matchedAlert?.device_name || 'Painel desconhecido',
      recipient_phone: phone,
      recipient_name: senderName,
      button_id: buttonRecord?.id || buttonId,
      button_label: buttonLabel || buttonRecord?.label || 'Confirmação',
      reference_message_id: referenceMessageId,
      raw_webhook: payload,
      alert_number: matchedAlert?.alert_number || null,
      incident_id: matchedAlert?.incident_id || null,
      incident_number: matchedAlert?.incident_number || null
    };

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

    // Send acknowledgment message
    const { data: agent } = await supabase
      .from('agents')
      .select('zapi_config')
      .eq('key', 'exa_alert')
      .single();

    if (agent?.zapi_config) {
      const zapiConfig = agent.zapi_config as { instance_id: string; token: string; client_token?: string };
      const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

      let ackMessage = '';
      if (actionType === 'pause_3h') {
        ackMessage = `✅ *Confirmação registrada!*\n\n` +
          `👤 ${senderName}\n` +
          `📍 ${deviceInfo?.name || matchedAlert?.device_name || 'Painel'}\n` +
          `⏸️ Notificações pausadas por *3 horas*\n` +
          `⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
      } else if (actionType === 'pause_indefinite') {
        ackMessage = `🛑 *Notificações interrompidas*\n\n` +
          `👤 ${senderName}\n` +
          `📍 ${deviceInfo?.name || matchedAlert?.device_name || 'Painel'}\n` +
          `⚠️ Você não receberá mais alertas deste painel\n` +
          `✅ Notificações voltarão quando o painel ficar online\n` +
          `⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
      } else {
        ackMessage = `✅ *Confirmação registrada!*\n\n` +
          `👤 ${senderName}\n` +
          `📍 ${deviceInfo?.name || matchedAlert?.device_name || 'Painel'}\n` +
          `🔘 ${buttonLabel}\n` +
          `⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (zapiClientToken) headers['Client-Token'] = zapiClientToken;
      else if (zapiConfig.client_token) headers['Client-Token'] = zapiConfig.client_token;

      try {
        await fetch(
          `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ phone, message: ackMessage })
          }
        );
        console.log('📤 [BUTTON-WEBHOOK] Acknowledgment sent');
      } catch (ackError) {
        console.error('⚠️ [BUTTON-WEBHOOK] Error sending ack:', ackError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, confirmation_id: confirmation?.id, action: actionType }),
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
