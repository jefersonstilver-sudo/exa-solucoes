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

    const { agentKey } = await req.json();
    console.log('[ZAPI-IMPORT] Starting history import for agent:', agentKey);

    // Buscar configuração Z-API do agente
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('key', agentKey)
      .eq('whatsapp_provider', 'zapi')
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent not found: ${agentKey}`);
    }

    const zapiConfig = agent.zapi_config as any;
    
    // Log da configuração completa para debug
    console.log('[ZAPI-IMPORT] Raw zapi_config:', JSON.stringify(zapiConfig, null, 2));
    
    if (!zapiConfig?.token || !zapiConfig?.instance_id) {
      throw new Error('Z-API configuration incomplete - missing token or instance_id');
    }

    if (!zapiConfig?.client_token) {
      throw new Error('Z-API configuration incomplete - missing client_token');
    }

    const instanceId = zapiConfig.instance_id;
    const token = zapiConfig.token;
    const clientToken = zapiConfig.client_token;

    console.log('[ZAPI-IMPORT] Extracted config:', {
      instanceId: instanceId?.substring(0, 8) + '...',
      hasToken: !!token,
      hasClientToken: !!clientToken
    });

    // Fetch chats from Z-API
    const chatsUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/chats`;
    console.log('[ZAPI-IMPORT] Full URL:', chatsUrl);
    
    const chatsResponse = await fetch(chatsUrl, {
      method: 'GET',
      headers: {
        'Client-Token': clientToken,
        'Content-Type': 'application/json'
      }
    });

    if (!chatsResponse.ok) {
      const errorText = await chatsResponse.text();
      throw new Error(`Z-API chats fetch failed: ${chatsResponse.status} - ${errorText}`);
    }

    const chatsData = await chatsResponse.json();
    console.log('[ZAPI-IMPORT] Chats fetched:', chatsData.length || 0);

    let conversationsImported = 0;
    let messagesImported = 0;

    // Process each chat
    for (const chat of chatsData) {
      try {
        const phoneNumber = chat.phone || chat.id?.replace('@s.whatsapp.net', '');
        if (!phoneNumber) continue;

        console.log('[ZAPI-IMPORT] Processing chat:', phoneNumber);

        // Create or update conversation (external_id includes agent_key for uniqueness)
        const externalId = `${phoneNumber}_${agentKey}`;
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('id')
          .eq('external_id', externalId)
          .maybeSingle();

        let conversationId;

        if (existingConv) {
          conversationId = existingConv.id;
          console.log('[ZAPI-IMPORT] Conversation exists:', conversationId);
        } else {
          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
              external_id: externalId,
              contact_phone: phoneNumber,
              contact_name: chat.name || null,
              agent_key: agentKey,
              provider: 'zapi',
              status: 'open',
              last_message_at: chat.lastMessageTime || new Date().toISOString()
            })
            .select()
            .single();

          if (convError) {
            console.error('[ZAPI-IMPORT] Failed to create conversation:', convError);
            continue;
          }

          conversationId = newConv.id;
          conversationsImported++;
          console.log('[ZAPI-IMPORT] New conversation created:', conversationId);
        }

        // Fetch messages for this chat
        const messagesUrl = `${ZAPI_BASE_URL}/instances/${instanceId}/token/${token}/chat/${phoneNumber}/messages?amount=100`;
        console.log('[ZAPI-IMPORT] Fetching messages from:', messagesUrl);
        
        const messagesResponse = await fetch(messagesUrl, {
          method: 'GET',
          headers: {
            'Client-Token': clientToken,
            'Content-Type': 'application/json'
          }
        });

        if (!messagesResponse.ok) {
          console.error('[ZAPI-IMPORT] Failed to fetch messages for:', phoneNumber);
          continue;
        }

        const messagesData = await messagesResponse.json();
        console.log('[ZAPI-IMPORT] Messages fetched:', messagesData.length || 0);

        // Import messages
        for (const msg of messagesData) {
          try {
            const messageId = msg.messageId || msg.id;
            if (!messageId) continue;

            // Check if message already exists
            const { data: existingMsg } = await supabase
              .from('messages')
              .select('id')
              .eq('conversation_id', conversationId)
              .eq('raw_payload->messageId', messageId)
              .maybeSingle();

            if (existingMsg) continue;

            // Extract message content
            let messageBody = '';
            if (msg.text?.message) {
              messageBody = msg.text.message;
            } else if (msg.body) {
              messageBody = msg.body;
            } else if (msg.image?.caption) {
              messageBody = `[Imagem] ${msg.image.caption}`;
            } else if (msg.audio) {
              messageBody = '[Áudio]';
            } else if (msg.video) {
              messageBody = '[Vídeo]';
            } else if (msg.document) {
              messageBody = `[Documento] ${msg.document.fileName || ''}`;
            }

            if (!messageBody) continue;

            const direction = msg.fromMe ? 'outbound' : 'inbound';
            const fromRole = msg.fromMe ? 'agent' : 'user';

            await supabase.from('messages').insert({
              conversation_id: conversationId,
              agent_key: agentKey,
              provider: 'zapi',
              direction,
              from_role: fromRole,
              body: messageBody,
              raw_payload: msg,
              created_at: msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() : undefined
            });

            messagesImported++;
          } catch (msgError) {
            console.error('[ZAPI-IMPORT] Failed to import message:', msgError);
          }
        }

        console.log('[ZAPI-IMPORT] Chat processed:', phoneNumber);
      } catch (chatError) {
        console.error('[ZAPI-IMPORT] Failed to process chat:', chatError);
      }
    }

    console.log('[ZAPI-IMPORT] Import completed:', {
      conversationsImported,
      messagesImported
    });

    return new Response(JSON.stringify({
      success: true,
      conversationsImported,
      messagesImported
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ZAPI-IMPORT] Error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
