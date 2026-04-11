import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZAPIChat {
  phone: string;
  name?: string;
  unreadCount?: number;
  lastMessageTime?: number;
  isGroup?: boolean;
  profilePicUrl?: string;
}

interface SyncStats {
  chats_from_zapi: number;
  conversations_created: number;
  conversations_updated: number;
  messages_synced: number;
  messages_outbound_synced: number;
  messages_inbound_synced: number;
  duplicates_skipped: number;
  errors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const stats: SyncStats = {
    chats_from_zapi: 0,
    conversations_created: 0,
    conversations_updated: 0,
    messages_synced: 0,
    messages_outbound_synced: 0,
    messages_inbound_synced: 0,
    duplicates_skipped: 0,
    errors: [],
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 [SYNC-CHATS] Iniciando sincronização via /get-chats...');

    // Buscar configuração dos agentes
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('key, zapi_config, whatsapp_number')
      .in('key', ['sofia', 'eduardo']);

    if (agentsError || !agents || agents.length === 0) {
      throw new Error('Nenhum agente configurado');
    }

    for (const agent of agents) {
      const zapiConfig = agent.zapi_config as any;
      if (!zapiConfig?.instance_id || !zapiConfig?.token) {
        console.log(`⚠️ [SYNC-CHATS] Agente ${agent.key} sem Z-API configurado`);
        continue;
      }

      const instanceId = zapiConfig.instance_id;
      const token = zapiConfig.token;

      console.log(`📱 [SYNC-CHATS] Processando agente: ${agent.key}`);

      // 1. Buscar lista de chats do Z-API
      const chatsUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/chats`;
      
      try {
        const chatsResponse = await fetch(chatsUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!chatsResponse.ok) {
          const errorText = await chatsResponse.text();
          console.error(`❌ [SYNC-CHATS] Erro ao buscar chats: ${errorText}`);
          stats.errors.push(`${agent.key}: ${errorText}`);
          continue;
        }

        const chats: ZAPIChat[] = await chatsResponse.json();
        console.log(`📋 [SYNC-CHATS] ${agent.key}: ${chats.length} chats encontrados`);
        stats.chats_from_zapi += chats.length;

        // 2. Processar cada chat
        for (const chat of chats) {
          try {
            // Normalizar telefone
            const phone = chat.phone.replace(/\D/g, '').replace('@c.us', '').replace('@g.us', '');
            if (!phone) continue;

            // Verificar/criar conversa
            const { data: existingConv } = await supabase
              .from('conversations')
              .select('id, contact_name, metadata')
              .eq('contact_phone', phone)
              .eq('agent_key', agent.key)
              .maybeSingle();

            let conversationId: string;

            if (existingConv) {
              conversationId = existingConv.id;
              
              // Atualizar nome se necessário
              if (chat.name && chat.name !== existingConv.contact_name) {
                await supabase
                  .from('conversations')
                  .update({ 
                    contact_name: chat.name,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', conversationId);
                stats.conversations_updated++;
              }
            } else {
              // Criar nova conversa
              const { data: newConv, error: convError } = await supabase
                .from('conversations')
                .insert({
                  contact_phone: phone,
                  contact_name: chat.name || null,
                  agent_key: agent.key,
                  is_group: chat.isGroup || false,
                  status: 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select('id')
                .single();

              if (convError) {
                console.error(`❌ [SYNC-CHATS] Erro ao criar conversa:`, convError);
                continue;
              }

              conversationId = newConv.id;
              stats.conversations_created++;
            }

            // 3. Buscar mensagens recentes deste chat via /queue (alternativa que funciona)
            // O endpoint /chat-messages não funciona em multi-device, então usamos /queue
            const queueUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/queue`;
            
            try {
              const queueResponse = await fetch(queueUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
              });

              if (queueResponse.ok) {
                const queueMessages = await queueResponse.json();
                
                // Filtrar mensagens deste telefone
                const chatMessages = Array.isArray(queueMessages) 
                  ? queueMessages.filter((m: any) => {
                      const msgPhone = (m.phone || m.to || m.from || '').replace(/\D/g, '');
                      return msgPhone === phone;
                    })
                  : [];

                for (const msg of chatMessages) {
                  const messageId = msg.zapiMessageId || msg.messageId || msg.id;
                  if (!messageId) continue;

                  // Verificar duplicata
                  const { data: existingMsg } = await supabase
                    .from('messages')
                    .select('id')
                    .eq('external_message_id', messageId)
                    .maybeSingle();

                  if (existingMsg) {
                    stats.duplicates_skipped++;
                    continue;
                  }

                  // Determinar direção
                  const isFromMe = msg.fromMe === true || msg.direction === 'outbound';
                  const direction = isFromMe ? 'outbound' : 'inbound';
                  const body = msg.text?.message || msg.body || msg.message || '';

                  if (!body) continue;

                  // Inserir mensagem
                  const { error: insertError } = await supabase
                    .from('messages')
                    .insert({
                      conversation_id: conversationId,
                      external_message_id: messageId,
                      body: body,
                      direction: direction,
                      sender_phone: isFromMe ? agent.whatsapp_number : phone,
                      status: 'delivered',
                      created_at: msg.momment ? new Date(msg.momment * 1000).toISOString() : new Date().toISOString(),
                      raw_payload: msg,
                    });

                  if (!insertError) {
                    stats.messages_synced++;
                    if (isFromMe) {
                      stats.messages_outbound_synced++;
                    } else {
                      stats.messages_inbound_synced++;
                    }
                  }
                }
              }
            } catch (queueError) {
              // Silently continue - queue might be empty
            }

          } catch (chatError) {
            console.error(`❌ [SYNC-CHATS] Erro processando chat:`, chatError);
          }
        }

      } catch (fetchError) {
        console.error(`❌ [SYNC-CHATS] Erro fetch ${agent.key}:`, fetchError);
        stats.errors.push(`${agent.key}: ${String(fetchError)}`);
      }
    }

    console.log('✅ [SYNC-CHATS] Sincronização concluída:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [SYNC-CHATS] Erro:', error);
    stats.errors.push(String(error));
    
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
        stats,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
