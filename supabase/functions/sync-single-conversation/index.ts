import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { conversationId, phone } = await req.json();
    
    if (!conversationId && !phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'conversationId ou phone é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('[SYNC-SINGLE] Iniciando sync para:', { conversationId, phone });

    // Buscar dados da conversa
    let conversation;
    if (conversationId) {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      conversation = data;
    } else if (phone) {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('contact_phone', phone)
        .single();
      conversation = data;
    }

    if (!conversation) {
      return new Response(
        JSON.stringify({ success: false, error: 'Conversa não encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const targetPhone = conversation.contact_phone;
    const agentKey = conversation.agent_key || 'eduardo';

    console.log('[SYNC-SINGLE] Conversa encontrada:', { 
      id: conversation.id, 
      phone: targetPhone, 
      agent: agentKey 
    });

    // Buscar configuração do agente
    const { data: agent } = await supabase
      .from('agents')
      .select('zapi_config')
      .eq('key', agentKey)
      .single();

    if (!agent?.zapi_config) {
      console.log('[SYNC-SINGLE] Tentando agente eduardo como fallback...');
      const { data: eduardoAgent } = await supabase
        .from('agents')
        .select('zapi_config')
        .eq('key', 'eduardo')
        .single();
      
      if (!eduardoAgent?.zapi_config) {
        return new Response(
          JSON.stringify({ success: false, error: 'Configuração Z-API não encontrada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      agent.zapi_config = eduardoAgent.zapi_config;
    }

    const zapiConfig = agent.zapi_config as { instance_id: string; token: string };
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    const stats = {
      messages_before: 0,
      messages_after: 0,
      messages_synced: 0,
      messages_outbound_synced: 0,
      messages_inbound_synced: 0,
      duplicates_skipped: 0,
      zapi_messages_fetched: 0,
      errors: [] as string[]
    };

    // Contar mensagens existentes
    const { count: beforeCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversation.id);
    
    stats.messages_before = beforeCount || 0;

    // 1. Sincronizar do zapi_logs (mensagens já logadas)
    console.log('[SYNC-SINGLE] Fase 1: Verificando zapi_logs...');
    const { data: zapiLogs } = await supabase
      .from('zapi_logs')
      .select('*')
      .eq('phone_number', targetPhone)
      .order('created_at', { ascending: true });

    if (zapiLogs && zapiLogs.length > 0) {
      for (const log of zapiLogs) {
        // Verificar se já existe
        const { data: existingMsg } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conversation.id)
          .eq('body', log.message_text || '')
          .gte('created_at', new Date(new Date(log.created_at).getTime() - 5000).toISOString())
          .lte('created_at', new Date(new Date(log.created_at).getTime() + 5000).toISOString())
          .maybeSingle();

        if (existingMsg) {
          stats.duplicates_skipped++;
          continue;
        }

        const direction = log.direction || (log.raw_from_me ? 'outbound' : 'inbound');

        const { error: insertError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            body: log.message_text || '',
            direction,
            created_at: log.created_at,
            raw_payload: log.raw_payload
          });

        if (!insertError) {
          stats.messages_synced++;
          if (direction === 'outbound') {
            stats.messages_outbound_synced++;
          } else {
            stats.messages_inbound_synced++;
          }
        }
      }
    }

    // 2. Tentar buscar do Z-API diretamente (get-chats endpoint)
    console.log('[SYNC-SINGLE] Fase 2: Buscando do Z-API...');
    try {
      const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/get-chats`;
      
      const zapiResponse = await fetch(zapiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': zapiClientToken || ''
        }
      });

      if (zapiResponse.ok) {
        const chats = await zapiResponse.json();
        
        // Encontrar o chat específico
        const targetChat = chats.find((chat: any) => {
          const chatPhone = chat.phone?.replace(/\D/g, '');
          const searchPhone = targetPhone.replace(/\D/g, '');
          return chatPhone === searchPhone || chatPhone?.endsWith(searchPhone) || searchPhone?.endsWith(chatPhone);
        });

        if (targetChat) {
          console.log('[SYNC-SINGLE] Chat encontrado no Z-API:', targetChat.name || targetChat.phone);
          
          // Buscar mensagens deste chat específico
          const messagesUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/chat-messages/${targetChat.phone}`;
          
          const messagesResponse = await fetch(messagesUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Client-Token': zapiClientToken || ''
            }
          });

          if (messagesResponse.ok) {
            const messages = await messagesResponse.json();
            stats.zapi_messages_fetched = messages.length || 0;

            for (const msg of (messages || [])) {
              const msgBody = msg.text?.message || msg.body || msg.caption || '';
              if (!msgBody) continue;

              const msgTimestamp = msg.momment ? new Date(msg.momment * 1000) : new Date();
              const direction = msg.fromMe ? 'outbound' : 'inbound';

              // Verificar duplicata
              const { data: existingMsg } = await supabase
                .from('messages')
                .select('id')
                .eq('conversation_id', conversation.id)
                .eq('body', msgBody)
                .gte('created_at', new Date(msgTimestamp.getTime() - 30000).toISOString())
                .lte('created_at', new Date(msgTimestamp.getTime() + 30000).toISOString())
                .maybeSingle();

              if (existingMsg) {
                stats.duplicates_skipped++;
                continue;
              }

              const { error: insertError } = await supabase
                .from('messages')
                .insert({
                  conversation_id: conversation.id,
                  body: msgBody,
                  direction,
                  created_at: msgTimestamp.toISOString(),
                  raw_payload: msg
                });

              if (!insertError) {
                stats.messages_synced++;
                if (direction === 'outbound') {
                  stats.messages_outbound_synced++;
                } else {
                  stats.messages_inbound_synced++;
                }
              }
            }
          } else {
            const errorText = await messagesResponse.text();
            console.log('[SYNC-SINGLE] Erro ao buscar mensagens do Z-API:', errorText);
            stats.errors.push(`Z-API messages: ${errorText}`);
          }
        } else {
          console.log('[SYNC-SINGLE] Chat não encontrado na lista do Z-API');
        }
      }
    } catch (zapiError) {
      console.error('[SYNC-SINGLE] Erro ao consultar Z-API:', zapiError);
      stats.errors.push(`Z-API: ${String(zapiError)}`);
    }

    // Contar mensagens finais
    const { count: afterCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversation.id);
    
    stats.messages_after = afterCount || 0;

    // Atualizar contadores de auditoria
    const { data: msgCounts } = await supabase
      .from('messages')
      .select('direction')
      .eq('conversation_id', conversation.id);

    const inboundCount = msgCounts?.filter(m => m.direction === 'inbound').length || 0;
    const outboundCount = msgCounts?.filter(m => m.direction === 'outbound').length || 0;

    await supabase
      .from('conversations')
      .update({
        audit_inbound_count: inboundCount,
        audit_outbound_count: outboundCount,
        audit_last_check: new Date().toISOString(),
        audit_sync_issue: outboundCount === 0 && inboundCount > 3
      })
      .eq('id', conversation.id);

    console.log('[SYNC-SINGLE] ✅ Sync completo:', stats);

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: conversation.id,
        contact_name: conversation.contact_name,
        contact_phone: targetPhone,
        stats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SYNC-SINGLE] Erro geral:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
