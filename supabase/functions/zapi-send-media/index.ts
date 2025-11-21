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

    const { agentKey, phone, mediaUrl, mediaType, caption } = await req.json();

    console.log('[ZAPI-SEND-MEDIA] 📎 Sending media:', {
      agentKey,
      phone,
      mediaType,
      hasCaption: !!caption,
      timestamp: new Date().toISOString()
    });

    if (!agentKey || !phone || !mediaUrl || !mediaType) {
      throw new Error('Missing required fields: agentKey, phone, mediaUrl, mediaType');
    }

    // Buscar configuração do agente
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('key', agentKey)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    const zapiConfig = agent.zapi_config as any;
    if (!zapiConfig?.instance_id || !zapiConfig?.token) {
      throw new Error('Z-API not configured for this agent');
    }

    const ZAPI_CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN');
    if (!ZAPI_CLIENT_TOKEN) {
      throw new Error('ZAPI_CLIENT_TOKEN not configured');
    }

    // Mapear tipo de mídia para endpoint Z-API
    const endpointMap: Record<string, string> = {
      'image': 'send-image',
      'audio': 'send-audio',
      'video': 'send-video',
      'document': 'send-document'
    };

    const endpoint = endpointMap[mediaType];
    if (!endpoint) {
      throw new Error(`Unsupported media type: ${mediaType}`);
    }

    // Montar payload baseado no tipo
    let payload: any = {
      phone,
    };

    switch (mediaType) {
      case 'image':
        payload.image = mediaUrl;
        if (caption) payload.caption = caption;
        break;
      case 'audio':
        payload.audio = mediaUrl;
        break;
      case 'video':
        payload.video = mediaUrl;
        if (caption) payload.caption = caption;
        break;
      case 'document':
        payload.document = mediaUrl;
        if (caption) payload.fileName = caption;
        break;
    }

    console.log('[ZAPI-SEND-MEDIA] 📤 Calling Z-API endpoint:', endpoint);

    // Enviar via Z-API
    const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/${endpoint}`;
    
    const response = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': ZAPI_CLIENT_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[ZAPI-SEND-MEDIA] ❌ Z-API error:', result);
      throw new Error(result.error || 'Failed to send media via Z-API');
    }

    console.log('[ZAPI-SEND-MEDIA] ✅ Media sent successfully');

    // Log no banco
    await supabase.from('zapi_logs').insert({
      agent_key: agentKey,
      direction: 'outbound',
      phone_number: phone,
      message_text: caption || `[${mediaType.toUpperCase()}]`,
      media_url: mediaUrl,
      status: 'success',
      metadata: {
        media_type: mediaType,
        zapi_response: result
      }
    });

    // Salvar na tabela messages também
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_phone', phone)
      .eq('agent_key', agentKey)
      .single();

    if (conversation) {
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        agent_key: agentKey,
        provider: 'zapi',
        direction: 'outbound',
        from_role: 'agent',
        body: caption || `[${mediaType.toUpperCase()}]`,
        raw_payload: { mediaUrl, mediaType }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: result.messageId,
        mediaType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ZAPI-SEND-MEDIA] 💥 Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});