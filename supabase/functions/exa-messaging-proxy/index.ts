import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MessagingRequest {
  channel: 'whatsapp' | 'sms' | 'email';
  to: string;
  message: string;
  metadata?: Record<string, any>;
  agentKey?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create user client to validate session
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized: Invalid session');
    }

    // Check if user is admin
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError) {
      console.error('[EXA-MESSAGING-PROXY] Error checking user role:', roleError);
    }

    const isAdmin = userData?.role && ['super_admin', 'admin', 'admin_marketing'].includes(userData.role);
    
    // Parse request
    const { channel, to, message, metadata, agentKey } = await req.json() as MessagingRequest;

    if (!channel || !to || !message) {
      throw new Error('Missing required fields: channel, to, message');
    }

    console.log(`[EXA-MESSAGING-PROXY] Request: ${channel} to ${to} by user ${user.id}`);

    let result: any = null;

    // Route to appropriate service
    switch (channel) {
      case 'whatsapp':
        result = await sendWhatsApp(supabase, to, message, agentKey, metadata);
        break;
      case 'email':
        result = await sendEmail(to, message, metadata);
        break;
      case 'sms':
        result = { success: false, error: 'SMS not yet implemented' };
        break;
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }

    // Log the notification attempt
    await logNotification(supabase, {
      user_id: user.id,
      channel,
      recipient: to,
      message: message.substring(0, 500),
      status: result.success ? 'sent' : 'failed',
      error: result.error,
      metadata
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[EXA-MESSAGING-PROXY] Error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendWhatsApp(
  supabase: any, 
  to: string, 
  message: string, 
  agentKey?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // Get Z-API credentials from agent config or EXA alerts config
    let instanceId: string | null = null;
    let instanceToken: string | null = null;
    let clientToken: string | null = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (agentKey) {
      // Get from specific agent
      const { data: agent } = await supabase
        .from('agents')
        .select('zapi_config')
        .eq('key', agentKey)
        .single();

      if (agent?.zapi_config) {
        const config = agent.zapi_config as any;
        instanceId = config.instance_id;
        instanceToken = config.token;
      }
    }

    // Fallback to EXA alerts config
    if (!instanceId || !instanceToken) {
      const { data: alertConfig } = await supabase
        .from('exa_alerts_config')
        .select('zapi_instance_id, zapi_token')
        .single();

      if (alertConfig) {
        instanceId = alertConfig.zapi_instance_id;
        instanceToken = alertConfig.zapi_token;
      }
    }

    if (!instanceId || !instanceToken) {
      return { success: false, error: 'Z-API credentials not configured' };
    }

    // Format phone number
    const formattedPhone = to.replace(/\D/g, '');
    
    // Send via Z-API
    const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (clientToken) {
      headers['Client-Token'] = clientToken;
    }

    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone: formattedPhone,
        message: message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || `Z-API error: ${response.status}`, data };
    }

    console.log('[EXA-MESSAGING-PROXY] WhatsApp sent successfully:', data);
    return { success: true, data };

  } catch (error) {
    console.error('[EXA-MESSAGING-PROXY] WhatsApp error:', error);
    return { success: false, error: error.message };
  }
}

async function sendEmail(
  to: string, 
  message: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      return { success: false, error: 'Resend API key not configured' };
    }

    const subject = metadata?.subject || 'Notificação EXA';
    const fromEmail = metadata?.from || 'EXA <noreply@examidia.com.br>';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: subject,
        html: message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || `Resend error: ${response.status}`, data };
    }

    console.log('[EXA-MESSAGING-PROXY] Email sent successfully:', data);
    return { success: true, data };

  } catch (error) {
    console.error('[EXA-MESSAGING-PROXY] Email error:', error);
    return { success: false, error: error.message };
  }
}

async function logNotification(supabase: any, log: {
  user_id: string;
  channel: string;
  recipient: string;
  message: string;
  status: string;
  error?: string;
  metadata?: any;
}): Promise<void> {
  try {
    await supabase
      .from('api_logs')
      .insert({
        api_name: 'exa-messaging-proxy',
        endpoint: log.channel,
        success: log.status === 'sent',
        error_message: log.error,
        request_payload: {
          recipient: log.recipient,
          message_preview: log.message.substring(0, 100),
          user_id: log.user_id
        },
        response_data: log.metadata
      });
  } catch (error) {
    console.error('[EXA-MESSAGING-PROXY] Failed to log notification:', error);
  }
}
