import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://examidia.com.br',
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
        // Preservar o ID original completo com sufixo (@c.us ou @s.whatsapp.net)
        const chatId = chat.id || chat.phone;
        const phoneNumber = chatId?.replace('@s.whatsapp.net', '').replace('@c.us', '') || '';
        
        // Para buscar mensagens no Z-API - usar formato completo com sufixo
        const formattedChatId = chatId?.includes('@') 
          ? chatId 
          : `${chatId}@c.us`;
        
        console.log('[ZAPI-IMPORT] 🔍 Original chat.id:', chat.id);
        console.log('[ZAPI-IMPORT] 🔍 Original chat.phone:', chat.phone);
        console.log('[ZAPI-IMPORT] 🔍 PhoneNumber (display):', phoneNumber);
        console.log('[ZAPI-IMPORT] 🔍 Formatted chatId (for API):', formattedChatId);
        
        // Filtrar conversas inválidas (WhatsApp Business, grupos, IDs nulos/0)
        if (!phoneNumber || phoneNumber === '0' || phoneNumber === 'null' || phoneNumber.includes('@g.us') || chatId?.includes('@g.us')) {
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

        // IMPORTANTE: No modo Multi-Device do WhatsApp, não é possível buscar histórico antigo
        // O endpoint /chat-messages retorna erro: "Does not work in multi device version"
        // Solução: Sincronizar apenas conversas e usar mensagens já capturadas pelo webhook no zapi_logs
        
        console.log('[ZAPI-IMPORT] ℹ️ Skipping message fetch (Multi-Device limitation)');
        
        // Buscar última mensagem do zapi_logs para atualizar data da conversa corretamente
        const { data: latestLog } = await supabaseClient
          .from('zapi_logs')
          .select('created_at, message_text, direction')
          .eq('phone_number', phoneNumber)
          .eq('agent_key', agentKey)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (latestLog) {
          // Atualizar conversa com data correta do último log
          const { error: updateError } = await supabaseClient
            .from('conversations')
            .update({
              last_message_at: latestLog.created_at,
              updated_at: new Date().toISOString()
            })
            .eq('contact_phone', phoneNumber)
            .eq('agent_key', agentKey);
          
          if (updateError) {
            console.error('[ZAPI-IMPORT] ❌ Error updating conversation date:', updateError);
          } else {
            console.log('[ZAPI-IMPORT] ✅ Updated conversation date from zapi_logs:', latestLog.created_at);
          }
        }
        
        conversationsImported++;


        console.log('[ZAPI-IMPORT] Chat processed:', phoneNumber);
      } catch (chatError) {
        console.error('[ZAPI-IMPORT] Failed to process chat:', chatError);
      }
    }

    console.log('[ZAPI-IMPORT] Sincronização concluída:', {
      conversationsImported,
      messagesImported: 0
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Sincronização concluída',
      conversationsImported,
      messagesImported: 0,
      info: 'Mensagens antigas não podem ser importadas (limitação Multi-Device). Novas mensagens são capturadas automaticamente pelo webhook.'
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
