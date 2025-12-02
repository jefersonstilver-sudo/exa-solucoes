import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gerar variações de telefone para busca
function getPhoneVariations(phone: string): string[] {
  const cleanPhone = phone.replace(/\D/g, '');
  const variations = new Set<string>();
  
  variations.add(cleanPhone);
  variations.add(phone);
  
  // Com e sem 55
  if (cleanPhone.startsWith('55')) {
    variations.add(cleanPhone.slice(2));
  } else {
    variations.add(`55${cleanPhone}`);
  }
  
  // Últimos 11 e 10 dígitos
  if (cleanPhone.length >= 11) {
    variations.add(cleanPhone.slice(-11));
    variations.add(cleanPhone.slice(-10));
  }
  
  // Com @s.whatsapp.net
  variations.add(`${cleanPhone}@s.whatsapp.net`);
  
  return Array.from(variations);
}

// Verificar se dois telefones são iguais
function phonesMatch(phone1: string, phone2: string): boolean {
  const clean1 = phone1.replace(/\D/g, '');
  const clean2 = phone2.replace(/\D/g, '');
  
  if (clean1 === clean2) return true;
  if (clean1.endsWith(clean2) || clean2.endsWith(clean1)) return true;
  
  // Comparar últimos 10-11 dígitos
  const last11_1 = clean1.slice(-11);
  const last11_2 = clean2.slice(-11);
  if (last11_1 === last11_2) return true;
  
  const last10_1 = clean1.slice(-10);
  const last10_2 = clean2.slice(-10);
  if (last10_1 === last10_2) return true;
  
  return false;
}

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
    const phoneVariations = getPhoneVariations(targetPhone);

    console.log('[SYNC-SINGLE] Conversa encontrada:', { 
      id: conversation.id, 
      phone: targetPhone, 
      agent: agentKey,
      phoneVariations 
    });

    // Buscar configuração do agente
    const { data: agent } = await supabase
      .from('agents')
      .select('zapi_config')
      .eq('key', agentKey)
      .single();

    let zapiConfig = agent?.zapi_config as { instance_id: string; token: string } | null;

    if (!zapiConfig) {
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
      
      zapiConfig = eduardoAgent.zapi_config as { instance_id: string; token: string };
    }

    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    const stats = {
      messages_before: 0,
      messages_after: 0,
      messages_synced: 0,
      messages_outbound_synced: 0,
      messages_inbound_synced: 0,
      duplicates_skipped: 0,
      zapi_messages_fetched: 0,
      zapi_logs_found: 0,
      queue_messages_found: 0,
      errors: [] as string[]
    };

    // Contar mensagens existentes
    const { count: beforeCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversation.id);
    
    stats.messages_before = beforeCount || 0;

    // ============================================================
    // FASE 1: Sincronizar do zapi_logs (com variações de telefone)
    // ============================================================
    console.log('[SYNC-SINGLE] Fase 1: Verificando zapi_logs...');
    
    // Buscar com OR para todas as variações de telefone
    const phoneOrConditions = phoneVariations.map(p => `phone_number.eq.${p}`).join(',');
    
    const { data: zapiLogs } = await supabase
      .from('zapi_logs')
      .select('*')
      .or(phoneOrConditions)
      .order('created_at', { ascending: true });

    stats.zapi_logs_found = zapiLogs?.length || 0;
    console.log(`[SYNC-SINGLE] Encontrados ${stats.zapi_logs_found} logs no zapi_logs`);

    if (zapiLogs && zapiLogs.length > 0) {
      for (const log of zapiLogs) {
        const msgText = log.message_text || '';
        if (!msgText) continue;

        // Verificar se já existe
        const { data: existingMsg } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conversation.id)
          .eq('body', msgText)
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
            body: msgText,
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

    // ============================================================
    // FASE 2: Buscar do Z-API via /chats (endpoint correto)
    // ============================================================
    console.log('[SYNC-SINGLE] Fase 2: Buscando chats do Z-API...');
    try {
      // CORREÇÃO: Usar /chats em vez de /get-chats
      const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/chats`;
      
      const zapiResponse = await fetch(zapiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': zapiClientToken || ''
        }
      });

      if (zapiResponse.ok) {
        const chatsResponse = await zapiResponse.json();
        
        // CORREÇÃO: Verificar se é array antes de usar .find()
        const chats = Array.isArray(chatsResponse) ? chatsResponse : [];
        console.log(`[SYNC-SINGLE] Z-API /chats retornou ${chats.length} chats`);
        
        if (chats.length === 0) {
          stats.errors.push('Z-API: Lista de chats vazia ou formato inválido');
        } else {
          // Encontrar o chat específico
          const targetChat = chats.find((chat: any) => {
            const chatPhone = (chat.phone || '').replace(/\D/g, '');
            return phonesMatch(chatPhone, targetPhone);
          });

          if (targetChat) {
            console.log('[SYNC-SINGLE] Chat encontrado:', targetChat.name || targetChat.phone);
          } else {
            console.log('[SYNC-SINGLE] Chat não encontrado na lista do Z-API');
          }
        }
      } else {
        const errorText = await zapiResponse.text();
        console.log('[SYNC-SINGLE] Erro ao buscar /chats:', zapiResponse.status, errorText);
        stats.errors.push(`Z-API /chats: ${zapiResponse.status}`);
      }
    } catch (zapiError) {
      console.error('[SYNC-SINGLE] Erro ao consultar Z-API /chats:', zapiError);
      stats.errors.push(`Z-API /chats: ${String(zapiError)}`);
    }

    // ============================================================
    // FASE 3: Buscar histórico de mensagens via /chat-messages/{phone}
    // ============================================================
    const cleanTargetPhone = targetPhone.replace(/\D/g, '');
    console.log('[SYNC-SINGLE] Fase 3: Buscando histórico do Z-API /chat-messages/' + cleanTargetPhone);
    
    try {
      // Usar /chat-messages/{phone} para buscar histórico REAL (últimas 50 mensagens)
      const messagesUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/chat-messages/${cleanTargetPhone}?amount=50`;
      
      console.log('[SYNC-SINGLE] URL:', messagesUrl);
      
      const messagesResponse = await fetch(messagesUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': zapiClientToken || ''
        }
      });

      console.log('[SYNC-SINGLE] Response status:', messagesResponse.status);

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        const chatMessages = Array.isArray(messagesData) ? messagesData : (messagesData?.messages || []);
        
        console.log(`[SYNC-SINGLE] Z-API /chat-messages retornou ${chatMessages.length} mensagens`);
        stats.queue_messages_found = chatMessages.length;

        for (const msg of chatMessages) {
          // Extrair texto da mensagem (vários formatos possíveis)
          const msgBody = msg.text?.message || msg.body || msg.caption || msg.message || msg.content || '';
          if (!msgBody) continue;

          // Timestamp - Z-API usa 'momment' ou 'timestamp' (em segundos)
          let msgTimestamp: Date;
          if (msg.momment) {
            msgTimestamp = new Date(msg.momment * 1000);
          } else if (msg.timestamp) {
            // Timestamp pode ser em segundos ou millisegundos
            msgTimestamp = msg.timestamp > 9999999999 
              ? new Date(msg.timestamp) 
              : new Date(msg.timestamp * 1000);
          } else {
            msgTimestamp = new Date();
          }

          // fromMe = true significa que foi enviado pelo Eduardo (outbound)
          const direction = msg.fromMe === true ? 'outbound' : 'inbound';

          // Verificar duplicata com janela de 60s
          const { data: existingMsg } = await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', conversation.id)
            .eq('body', msgBody)
            .gte('created_at', new Date(msgTimestamp.getTime() - 60000).toISOString())
            .lte('created_at', new Date(msgTimestamp.getTime() + 60000).toISOString())
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
            stats.zapi_messages_fetched++;
            if (direction === 'outbound') {
              stats.messages_outbound_synced++;
            } else {
              stats.messages_inbound_synced++;
            }
            console.log(`[SYNC-SINGLE] + Mensagem ${direction}: "${msgBody.substring(0, 50)}..."`);
          }
        }
      } else {
        const errorText = await messagesResponse.text();
        console.log('[SYNC-SINGLE] Erro ao buscar /chat-messages:', messagesResponse.status, errorText);
        stats.errors.push(`Z-API /chat-messages: ${messagesResponse.status} - ${errorText}`);
      }
    } catch (messagesError) {
      console.error('[SYNC-SINGLE] Erro ao consultar Z-API /chat-messages:', messagesError);
      stats.errors.push(`Z-API /chat-messages: ${String(messagesError)}`);
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
