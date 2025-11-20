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

    const { agentKey, phone, message, mediaUrl } = await req.json();

    if (!agentKey || !phone || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar configuração do agente
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('key', agentKey)
      .eq('whatsapp_provider', 'zapi')
      .single();

    if (agentError || !agent) {
      console.error('[ZAPI-SEND] Agent not found:', agentKey);
      return new Response(JSON.stringify({ error: 'Agent not configured for Z-API' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const zapiConfig = agent.zapi_config;
    if (!zapiConfig?.instance_id || !zapiConfig?.token) {
      console.error('[ZAPI-SEND] Invalid Z-API config for agent:', agentKey);
      return new Response(JSON.stringify({ error: 'Invalid Z-API configuration' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar Client Token do Z-API
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
    
    console.log('[ZAPI-SEND] 🔍 DEBUG - Client Token present:', !!zapiClientToken);
    console.log('[ZAPI-SEND] 🔍 DEBUG - Client Token length:', zapiClientToken?.length || 0);
    
    if (!zapiClientToken) {
      console.error('[ZAPI-SEND] ❌ ZAPI_CLIENT_TOKEN not configured in environment');
      return new Response(JSON.stringify({ error: 'Z-API Client Token not configured in secrets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Construir URL da API Z-API para envio de mensagem
    const sendUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;

    console.log('[ZAPI-SEND] 📤 Sending message via Z-API:', {
      agent: agentKey,
      phone,
      messagePreview: message.substring(0, 50) + '...',
      messageLength: message.length,
      hasClientToken: !!zapiClientToken,
      instanceId: zapiConfig.instance_id,
      timestamp: new Date().toISOString()
    });

    // Enviar mensagem via Z-API (com Client-Token no header)
    const zapiResponse = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': zapiClientToken, // ✅ CRÍTICO: Client-Token necessário
      },
      body: JSON.stringify({
        phone: phone.replace(/\D/g, ''), // Remove caracteres não numéricos
        message: message
      })
    });

    const zapiResult = await zapiResponse.json();

    if (!zapiResponse.ok) {
      console.error('[ZAPI-SEND] ❌ Z-API error:', {
        status: zapiResponse.status,
        statusText: zapiResponse.statusText,
        result: zapiResult
      });
      
      // Log falha
      await supabase.from('zapi_logs').insert({
        agent_key: agentKey,
        direction: 'outbound',
        phone_number: phone,
        message_text: message,
        status: 'failed',
        error_message: JSON.stringify(zapiResult),
        metadata: { error: zapiResult }
      });

      throw new Error(`Z-API error: ${JSON.stringify(zapiResult)}`);
    }

    console.log('[ZAPI-SEND] ✅ Message sent successfully:', {
      messageId: zapiResult.messageId,
      phone,
      agent: agentKey,
      timestamp: new Date().toISOString()
    });

    // Log sucesso
    await supabase.from('zapi_logs').insert({
      agent_key: agentKey,
      direction: 'outbound',
      phone_number: phone,
      message_text: message,
      media_url: mediaUrl || null,
      status: 'sent',
      zapi_message_id: zapiResult.messageId || null,
      metadata: { response: zapiResult }
    });

    // Log no agent_logs também
    await supabase.from('agent_logs').insert({
      agent_key: agentKey,
      event_type: 'message_sent',
      metadata: {
        phone,
        messageId: zapiResult.messageId,
        provider: 'zapi'
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      messageId: zapiResult.messageId,
      zapiResponse: zapiResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ZAPI-SEND] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
