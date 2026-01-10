import { supabase } from '@/integrations/supabase/client';

interface NotificationOptions {
  priority: 'low' | 'medium' | 'high' | 'critical';
  channel: 'whatsapp' | 'sms' | 'email';
  throttle?: boolean;
}

/**
 * Notify directors about alerts or important events
 * Looks up directors with appropriate notification preferences
 */
export const notifyDirectors = async (
  alertOrSummary: any,
  options: NotificationOptions
): Promise<void> => {
  console.log('📢 [NOTIFICATIONS] Notifying directors:', options.priority);

  try {
    // Fetch active directors with notification preferences
    const { data: directors, error: directorsError } = await supabase
      .from('directors')
      .select('*')
      .eq('is_active', true);

    if (directorsError || !directors) {
      console.error('❌ [NOTIFICATIONS] Error fetching directors:', directorsError);
      return;
    }

    console.log(`📋 [NOTIFICATIONS] Found ${directors.length} active directors`);

    // Filter directors based on notification preferences and priority
    const eligibleDirectors = directors.filter(director => {
      // Check if director wants notifications for this priority level
      // For now, notify all active directors since notify_preferences field needs to be added
      // TODO: Add notify_preferences JSONB field to directors table with:
      // { "min_severity": "high", "channels": ["whatsapp"], "quiet_hours": { "start": "22:00", "end": "08:00" } }
      
      // Temporarily allow all directors
      return true;
      
      // Future implementation:
      // const prefs = (director as any).notify_preferences || {};
      // const minSeverity = prefs.min_severity || 'medium';
      // const channels = prefs.channels || ['whatsapp'];
      
      // Check severity threshold
      // const severityOrder = ['low', 'medium', 'high', 'critical'];
      // if (severityOrder.indexOf(options.priority) < severityOrder.indexOf(minSeverity)) {
      //   return false;
      // }

      // // Check if requested channel is enabled
      // if (!channels.includes(options.channel)) {
      //   return false;
      // }

      // // Check quiet hours (if implemented)
      // if (prefs.quiet_hours && isQuietHour(prefs.quiet_hours)) {
      //   return false;
      // }

      // return true;
    });

    console.log(`✅ [NOTIFICATIONS] ${eligibleDirectors.length} directors eligible for notification`);

    // Send notifications
    for (const director of eligibleDirectors) {
      try {
        await sendNotification(director, alertOrSummary, options);
      } catch (notifError) {
        console.error(`❌ [NOTIFICATIONS] Error notifying director ${director.id}:`, notifError);
      }
    }

  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error in notifyDirectors:', error);
  }
};

/**
 * Check if current time is within quiet hours
 */
const isQuietHour = (quietHours: { start: string; end: string }): boolean => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = quietHours.start.split(':').map(Number);
  const [endHour, endMin] = quietHours.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (startTime < endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Crosses midnight
    return currentTime >= startTime || currentTime <= endTime;
  }
};

/**
 * Send notification to a specific director
 */
const sendNotification = async (
  director: any,
  content: any,
  options: NotificationOptions
): Promise<void> => {
  console.log(`📤 [NOTIFICATIONS] Sending ${options.channel} to director:`, director.name);

  const message = formatNotificationMessage(content, options);

  if (options.channel === 'whatsapp') {
    await sendWhatsAppNotificationStub(director.phone, message, content);
  } else if (options.channel === 'sms') {
    await sendSMSNotificationStub(director.phone, message);
  } else if (options.channel === 'email') {
    // Email notification stub
    console.log('📧 [NOTIFICATIONS] Email notification stub (not implemented)');
  }
};

/**
 * Format notification message based on content and priority
 */
const formatNotificationMessage = (content: any, options: NotificationOptions): string => {
  const priorityEmoji = {
    low: 'ℹ️',
    medium: '⚠️',
    high: '🚨',
    critical: '🔴'
  };

  const emoji = priorityEmoji[options.priority];
  
  let message = `${emoji} *Alerta EXA - ${options.priority.toUpperCase()}*\n\n`;

  if (content.alert_type) {
    // Device alert
    message += `📍 *Tipo:* ${content.alert_type}\n`;
    message += `🏢 *Condomínio:* ${content.device?.condominio_name || 'N/A'}\n`;
    message += `📱 *Dispositivo:* ${content.device?.name || 'N/A'}\n`;
    message += `🕐 *Detectado:* ${new Date(content.created_at).toLocaleString('pt-BR')}\n`;
  } else if (content.summary) {
    // Analysis/conversation alert
    message += `💬 *Resumo:* ${content.summary}\n`;
    message += `📱 *Contato:* ${content.conversation?.contact_phone || 'N/A'}\n`;
    message += `🎯 *Intenção:* ${content.intent || 'geral'}\n`;
    
    if (content.suggested_reply) {
      message += `\n💡 *Resposta sugerida:*\n${content.suggested_reply}\n`;
    }
  }

  message += `\n🔗 Acesse o painel: https://exa.com/monitoramento-ia`;

  return message;
};

/**
 * Send WhatsApp notification (stub - requires actual service integration)
 */
/**
 * Send WhatsApp notification using secure Edge Function (no exposed API keys)
 */
export const sendWhatsAppNotificationStub = async (
  toNumber: string,
  text: string,
  metadata?: any
): Promise<void> => {
  console.log(`📱 [NOTIFICATIONS] Sending WhatsApp to ${toNumber} via secure proxy...`);

  try {
    // Use secure Edge Function instead of direct API call
    const { data, error } = await supabase.functions.invoke('exa-messaging-proxy', {
      body: {
        channel: 'whatsapp',
        to: toNumber,
        message: text,
        metadata
      }
    });

    if (error) {
      throw new Error(`Messaging proxy error: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Unknown error from messaging proxy');
    }

    console.log('✅ [NOTIFICATIONS] WhatsApp sent successfully via secure proxy');
    
    await saveNotificationLog({
      recipient: toNumber,
      message: text,
      channel: 'whatsapp',
      status: 'sent',
      metadata
    });

  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error sending WhatsApp:', error);
    
    await saveNotificationLog({
      recipient: toNumber,
      message: text,
      channel: 'whatsapp',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata
    });
  }
};

/**
 * Send SMS notification (stub)
 */
const sendSMSNotificationStub = async (
  toNumber: string,
  text: string
): Promise<void> => {
  console.log(`📱 [NOTIFICATIONS] SMS stub - would send to ${toNumber}:`, text);
  
  await saveNotificationLog({
    recipient: toNumber,
    message: text,
    channel: 'sms',
    status: 'simulated'
  });
};

/**
 * Save notification log to database for audit
 */
const saveNotificationLog = async (log: {
  recipient: string;
  message: string;
  channel: string;
  status: string;
  error?: string;
  metadata?: any;
}): Promise<void> => {
  try {
    // Save to a notifications audit table (create if doesn't exist)
    // For now, log to console
    console.log('📝 [NOTIFICATIONS] Log saved:', log);
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Error saving log:', error);
  }
};
