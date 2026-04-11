import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMessageRequest {
  conversationId: string;
  agentKey: string;
  message: string;
  metadata?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { conversationId, agentKey, message, metadata } = await req.json() as SendMessageRequest;

    console.log('[SEND-MESSAGE-UNIFIED] Request:', { conversationId, agentKey, messageLength: message?.length });

    // 1. Buscar conversation para identificar provider
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('provider, contact_phone, agent_key, external_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    // 2. Buscar agente
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('key', agentKey)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    // 3. Delegar para provider específico
    let result;
    if (conversation.provider === 'manychat') {
      result = await sendViaManychat(agent, conversation.external_id, message);
    } else if (conversation.provider === 'zapi') {
      result = await sendViaZapi(agent, conversation.contact_phone, message);
    } else {
      throw new Error(`Unknown provider: ${conversation.provider}`);
    }

    // 4. Registrar mensagem enviada
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      agent_key: agentKey,
      provider: conversation.provider,
      direction: 'outbound',
      from_role: 'agent',
      body: message,
      is_automated: metadata?.is_automated || false,
      raw_payload: result
    });

    // 5. Atualizar conversation
    await supabase
      .from('conversations')
      .update({ 
        awaiting_response: false,
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    console.log('[SEND-MESSAGE-UNIFIED] Success:', { provider: conversation.provider });

    return new Response(
      JSON.stringify({ success: true, provider: conversation.provider }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SEND-MESSAGE-UNIFIED] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendViaManychat(agent: any, subscriberId: string, message: string) {
  const apiKey = agent.manychat_config?.api_key;
  
  if (!apiKey) {
    throw new Error('ManyChat API Key not configured for this agent');
  }

  console.log('[MANYCHAT] Sending message to subscriber:', subscriberId);

  const response = await fetch('https://api.manychat.com/fb/sending/sendContent', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subscriber_id: subscriberId,
      data: {
        version: 'v2',
        content: {
          messages: [
            {
              type: 'text',
              text: message
            }
          ]
        }
      }
    })
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('[MANYCHAT] API error:', result);
    throw new Error(`ManyChat API error: ${result.message || 'Unknown error'}`);
  }

  console.log('[MANYCHAT] Message sent successfully');
  return result;
}

async function sendViaZapi(agent: any, phone: string, message: string) {
  const zapiConfig = agent.zapi_config;
  
  if (!zapiConfig?.instance_id || !zapiConfig?.token) {
    throw new Error('Z-API not configured for this agent');
  }

  console.log('[ZAPI] Sending message to phone:', phone);

  const url = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: phone.replace(/\D/g, ''),
      message: message
    })
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('[ZAPI] API error:', result);
    throw new Error(`Z-API error: ${result.error || 'Unknown error'}`);
  }

  console.log('[ZAPI] Message sent successfully');
  return result;
}
