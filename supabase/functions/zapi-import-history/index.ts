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
    
    // Verificar se é uma configuração pendente/incompleta
    if (zapiConfig?.status === 'pending_setup' || zapiConfig?.instance_id === 'PENDING_SETUP') {
      console.log('[ZAPI-IMPORT] Agent has pending setup, skipping');
      return new Response(JSON.stringify({
        success: true,
        message: 'Agent configuration is pending setup',
        conversationsImported: 0,
        messagesImported: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!zapiConfig?.token || !zapiConfig?.instance_id || !zapiConfig?.client_token) {
      throw new Error('Z-API configuration incomplete - missing required fields');
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
        
        // Filtrar conversas inválidas (WhatsApp Business, grupos, IDs nulos/0)
        if (!phoneNumber || phoneNumber === '0' || phoneNumber === 'null' || phoneNumber.includes('@g.us')) {
          console.log('[ZAPI-IMPORT] Skipping invalid chat:', phoneNumber || 'null');
          continue;
        }

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
          // Converter timestamp corretamente
          let lastMessageAt = new Date().toISOString();
          if (chat.lastMessageTime) {
            try {
              // Se for número (timestamp em segundos ou milissegundos)
              if (typeof chat.lastMessageTime === 'number') {
                const timestamp = chat.lastMessageTime > 9999999999 
                  ? chat.lastMessageTime // já em milissegundos
                  : chat.lastMessageTime * 1000; // converter de segundos
                lastMessageAt = new Date(timestamp).toISOString();
              } else {
                lastMessageAt = new Date(chat.lastMessageTime).toISOString();
              }
            } catch (e) {
              console.error('[ZAPI-IMPORT] Failed to parse lastMessageTime:', e);
            }
          }

          const { data: newConv, error: convError } = await supabase
            .from('conversations')
            .insert({
              external_id: externalId,
              contact_phone: phoneNumber,
              contact_name: chat.name || null,
              agent_key: agentKey,
              provider: 'zapi',
              status: 'open',
              last_message_at: lastMessageAt
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

        // Endpoint correto do Z-API (requer amount e lastMessageId como query params)
        const messagesUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/chat-messages/${phoneNumber}?amount=50`;
        console.log('[ZAPI-IMPORT] 📞 Fetching messages from:', messagesUrl);
        
        const messagesResponse = await fetch(messagesUrl, {
          method: 'GET',
          headers: {
            'Client-Token': clientToken,
            'Content-Type': 'application/json'
          }
        });

        console.log('[ZAPI-IMPORT] 📡 Response:', messagesResponse.status, messagesResponse.statusText);

        if (!messagesResponse.ok) {
          const errorText = await messagesResponse.text();
          console.error('[ZAPI-IMPORT] ❌ Failed to fetch messages:', phoneNumber);
          console.error('[ZAPI-IMPORT] ❌ Error:', errorText);
          console.error('[ZAPI-IMPORT] ❌ URL used:', messagesUrl);
          continue;
        }

        const messagesResponseData = await messagesResponse.json();
        
        // LOG DETALHADO COMPLETO para debug
        console.log('[ZAPI-IMPORT] 🔍 ========== RESPONSE DEBUG ==========');
        console.log('[ZAPI-IMPORT] 🔍 Type:', typeof messagesResponseData);
        console.log('[ZAPI-IMPORT] 🔍 Is array?', Array.isArray(messagesResponseData));
        console.log('[ZAPI-IMPORT] 🔍 Keys:', messagesResponseData ? Object.keys(messagesResponseData).join(', ') : 'null');
        console.log('[ZAPI-IMPORT] 🔍 Full response (first 500 chars):', JSON.stringify(messagesResponseData).substring(0, 500));
        console.log('[ZAPI-IMPORT] 🔍 ====================================');
        
        // Z-API pode retornar array direto ou objeto com array
        let messagesData = [];
        
        if (Array.isArray(messagesResponseData)) {
          // Array direto
          messagesData = messagesResponseData;
          console.log('[ZAPI-IMPORT] ✅ Using direct array, length:', messagesData.length);
        } else if (messagesResponseData && typeof messagesResponseData === 'object') {
          // Objeto - tentar várias estruturas possíveis
          const possibleKeys = ['messages', 'data', 'items', 'chats', 'list', 'result'];
          
          for (const key of possibleKeys) {
            if (Array.isArray(messagesResponseData[key])) {
              messagesData = messagesResponseData[key];
              console.log(`[ZAPI-IMPORT] ✅ Using .${key} array, length:`, messagesData.length);
              break;
            }
          }
          
          // Se ainda não encontrou, procurar em todas as chaves
          if (messagesData.length === 0) {
            const allKeys = Object.keys(messagesResponseData);
            console.log('[ZAPI-IMPORT] 🔍 Searching in all keys:', allKeys.join(', '));
            
            for (const key of allKeys) {
              if (Array.isArray(messagesResponseData[key]) && messagesResponseData[key].length > 0) {
                messagesData = messagesResponseData[key];
                console.log(`[ZAPI-IMPORT] ✅ Found array in key "${key}", length:`, messagesData.length);
                break;
              }
            }
          }
        }
        
        console.log('[ZAPI-IMPORT] 📊 Final messages count:', messagesData.length || 0);
        
        if (messagesData.length === 0) {
          console.log('[ZAPI-IMPORT] ⚠️ WARNING: No messages found in response for:', phoneNumber);
          console.log('[ZAPI-IMPORT] ⚠️ Response structure:', JSON.stringify(messagesResponseData, null, 2).substring(0, 1000));
        }

        // Import messages com ON CONFLICT para evitar duplicatas
        if (messagesData && messagesData.length > 0) {
          console.log('[ZAPI-IMPORT] Processing', messagesData.length, 'messages');
          
          for (const msg of messagesData) {
            try {
              const messageId = msg.messageId || msg.id;
              if (!messageId) {
                console.log('[ZAPI-IMPORT] Skipping message without ID');
                continue;
              }

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
              } else if (msg.image) {
                messageBody = '[Imagem]';
              }

              if (!messageBody) {
                console.log('[ZAPI-IMPORT] Skipping message without body');
                continue;
              }

              const direction = msg.fromMe ? 'outbound' : 'inbound';
              const fromRole = msg.fromMe ? 'agent' : 'user';

              // Converter timestamp corretamente
              let createdAt = new Date().toISOString();
              if (msg.timestamp) {
                try {
                  const timestamp = msg.timestamp > 9999999999 
                    ? msg.timestamp // já em milissegundos
                    : msg.timestamp * 1000; // converter de segundos
                  createdAt = new Date(timestamp).toISOString();
                } catch (e) {
                  console.error('[ZAPI-IMPORT] Failed to parse message timestamp:', e);
                }
              }

              // Criar registro com messageId no raw_payload para deduplicação
              const messageData = {
                conversation_id: conversationId,
                agent_key: agentKey,
                provider: 'zapi',
                direction,
                from_role: fromRole,
                body: messageBody,
                raw_payload: { ...msg, messageId }, // Garantir que messageId está no payload
                created_at: createdAt
              };

              // Verificar duplicata antes de inserir (mais confiável)
              const { data: existingMsg } = await supabase
                .from('messages')
                .select('id')
                .eq('conversation_id', conversationId)
                .eq('body', messageBody)
                .eq('direction', direction)
                .eq('created_at', createdAt)
                .maybeSingle();

              if (existingMsg) {
                console.log('[ZAPI-IMPORT] Message already exists, skipping');
                continue;
              }

              const { error: insertError } = await supabase
                .from('messages')
                .insert(messageData);

              if (insertError) {
                console.error('[ZAPI-IMPORT] Failed to insert message:', insertError);
              } else {
                messagesImported++;
              }
            } catch (msgError) {
              console.error('[ZAPI-IMPORT] Failed to import message:', msgError);
            }
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
