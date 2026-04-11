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

    // STRATEGY 1: Extract device_id from button ID if it contains it (format: buttonId:deviceId)
    let deviceIdFromButton: string | null = null;
    let actualButtonId = buttonId;
    
    if (buttonId && buttonId.includes(':')) {
      const parts = buttonId.split(':');
      actualButtonId = parts[0];
      deviceIdFromButton = parts[1];
      console.log('📍 [BUTTON-WEBHOOK] Device ID extracted from button:', deviceIdFromButton);
    }

    // Find button record
    let buttonRecord = null;
    if (actualButtonId) {
      const { data: btn } = await supabase
        .from('panel_offline_alert_buttons')
        .select('*')
        .eq('id', actualButtonId)
        .single();
      buttonRecord = btn;
    }

    // STRATEGY 2: Find recent alert that matches phone AND get device info
    let matchedAlert = null;
    let deviceInfo = null;
    let deviceId: string | null = deviceIdFromButton;

    // If we already have device ID from button, fetch device directly
    if (deviceId) {
      const { data: device } = await supabase
        .from('devices')
        .select('id, name, metadata')
        .eq('id', deviceId)
        .single();
      
      if (device) {
        deviceInfo = device;
        console.log('✅ [BUTTON-WEBHOOK] Device found by ID:', device.name);
      }

      // Also find the most recent alert for this device - use created_at (correct column)
      const { data: alertData } = await supabase
        .from('panel_offline_alerts_history')
        .select('*')
        .eq('painel_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (alertData) {
        matchedAlert = alertData;
      }
    } else {
      // Fallback: Find by matching phone in recipients - use destinatarios_notificados (correct column)
      const { data: recentAlerts } = await supabase
        .from('panel_offline_alerts_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (recentAlerts) {
        const phoneClean = phone?.replace(/\D/g, '');
        
        for (const alert of recentAlerts) {
          // Use destinatarios_notificados which is the correct column (array of phone strings)
          const recipients = alert.destinatarios_notificados || [];
          
          for (const recipientPhone of recipients) {
            const recipientClean = recipientPhone?.replace(/\D/g, '');
            if (recipientClean && phoneClean && 
                (recipientClean.includes(phoneClean.slice(-8)) || phoneClean.includes(recipientClean.slice(-8)))) {
              matchedAlert = alert;
              deviceId = alert.painel_id;
              console.log('📍 [BUTTON-WEBHOOK] Matched alert by phone for painel_id:', deviceId);
              break;
            }
          }
          if (matchedAlert) break;
        }

        // Now fetch the device info
        if (deviceId) {
          const { data: device } = await supabase
            .from('devices')
            .select('id, name, metadata')
            .eq('id', deviceId)
            .single();
          
          if (device) {
            deviceInfo = device;
          }
        }
      }
    }

    const metadata = (deviceInfo?.metadata || {}) as Record<string, any>;
    const deviceName = deviceInfo?.name || 'Painel desconhecido';

    // DETERMINE ACTION BASED ON BUTTON LABEL
    let actionType = 'confirmation';
    let pauseDuration: string | null = null;

    if (buttonLabel.toLowerCase().includes('visualizei') || buttonLabel.toLowerCase().includes('👁️')) {
      // "Já Visualizei" - Pause for 3 hours
      actionType = 'pause_3h';
      pauseDuration = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      console.log('⏸️ [BUTTON-WEBHOOK] Pausando notificações por 3 horas para:', deviceName);
    } else if (buttonLabel.toLowerCase().includes('interromper') || buttonLabel.toLowerCase().includes('🛑')) {
      // "Interromper Notificações" - Pause indefinitely until online
      actionType = 'pause_indefinite';
      pauseDuration = 'indefinite';
      console.log('🛑 [BUTTON-WEBHOOK] Interrompendo notificações até voltar online para:', deviceName);
    }

    // Update device metadata if we have a device and an action to pause
    if (deviceId && pauseDuration) {
      const newMetadata = {
        ...metadata,
        notifications_paused_until: pauseDuration,
        paused_by: phone,
        paused_by_name: senderName,
        paused_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('devices')
        .update({ metadata: newMetadata })
        .eq('id', deviceId);

      if (updateError) {
        console.error('❌ [BUTTON-WEBHOOK] Error updating device metadata:', updateError);
      } else {
        console.log('✅ [BUTTON-WEBHOOK] Device metadata updated with pause:', pauseDuration, 'for device:', deviceId);
      }
    } else {
      console.warn('⚠️ [BUTTON-WEBHOOK] Could not update device - deviceId:', deviceId, 'pauseDuration:', pauseDuration);
    }

    // Insert confirmation record with incident info
    const confirmationData = {
      alert_history_id: matchedAlert?.id || null,
      device_id: deviceId || null,
      device_name: deviceName,
      recipient_phone: phone,
      recipient_name: senderName,
      button_id: buttonRecord?.id || actualButtonId,
      button_label: buttonLabel || buttonRecord?.label || 'Confirmação',
      reference_message_id: referenceMessageId,
      raw_webhook: payload,
      alert_number: matchedAlert?.alert_number || metadata.offline_alert_count || null,
      incident_id: matchedAlert?.incident_id || metadata.current_incident_id || null,
      incident_number: matchedAlert?.incident_number || metadata.incident_number || null
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
    
    console.log('✅ [BUTTON-WEBHOOK] Confirmation recorded:', confirmation.id, 'for device:', deviceName);

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
          `📍 ${deviceName}\n` +
          `⏸️ Notificações pausadas por *3 horas*\n` +
          `⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
      } else if (actionType === 'pause_indefinite') {
        ackMessage = `🛑 *Notificações interrompidas*\n\n` +
          `👤 ${senderName}\n` +
          `📍 ${deviceName}\n` +
          `⚠️ Você não receberá mais alertas deste painel\n` +
          `✅ Notificações voltarão quando o painel ficar online\n` +
          `⏰ ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
      } else {
        ackMessage = `✅ *Confirmação registrada!*\n\n` +
          `👤 ${senderName}\n` +
          `📍 ${deviceName}\n` +
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
      JSON.stringify({ 
        success: true, 
        confirmation_id: confirmation?.id, 
        action: actionType,
        device_id: deviceId,
        device_name: deviceName,
        pause_until: pauseDuration
      }),
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
