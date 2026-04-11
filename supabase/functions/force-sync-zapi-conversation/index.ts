import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Criar hash para deduplicação (conversation_id + body normalizado + timestamp arredondado ao minuto)
function createDedupeHash(conversationId: string, body: string, timestamp: number): string {
  const normalizedBody = body.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
  const roundedTs = Math.floor(timestamp / 60000); // Arredondar para minuto
  const data = `${conversationId}|${normalizedBody}|${roundedTs}`;
  try {
    return btoa(unescape(encodeURIComponent(data))).slice(0, 48);
  } catch {
    return btoa(encodeURIComponent(data).replace(/%/g, '_')).slice(0, 48);
  }
}

// Limpar telefone para formato consistente
function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '').replace('@s.whatsapp.net', '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const stats = {
    recuperadas: 0,
    outbound: 0,
    inbound: 0,
    duplicatas: 0,
    erros: 0,
    zapi_logs_total: 0,
    debug_messages: [] as string[]
  };

  try {
    const { conversationId } = await req.json();
    
    console.log('[FORCE-SYNC] ====== INICIANDO (via zapi_logs) ======');
    console.log('[FORCE-SYNC] Input:', { conversationId });

    if (!conversationId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'conversationId é obrigatório' 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      });
    }

    // 1. Buscar conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (convError || !conversation) {
      console.error('[FORCE-SYNC] Erro ao buscar conversa:', convError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Conversa não encontrada: ${convError?.message || 'ID inválido'}` 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404 
      });
    }

    const targetPhone = cleanPhone(conversation.contact_phone);
    const agentKey = conversation.agent_key || 'eduardo';

    console.log('[FORCE-SYNC] Conversa:', {
      id: conversation.id,
      contact_name: conversation.contact_name,
      phone: targetPhone,
      agent: agentKey
    });

    // 2. Buscar mensagens existentes na tabela messages para criar sets de deduplicação
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id, external_message_id, body, created_at')
      .eq('conversation_id', conversation.id);

    const existingMessageIds = new Set<string>();
    const existingHashes = new Set<string>();

    for (const msg of existingMessages || []) {
      if (msg.external_message_id) {
        existingMessageIds.add(msg.external_message_id);
      }
      if (msg.body && msg.created_at) {
        const ts = new Date(msg.created_at).getTime();
        const hash = createDedupeHash(conversation.id, msg.body, ts);
        existingHashes.add(hash);
      }
    }

    console.log('[FORCE-SYNC] Mensagens existentes em messages:', existingMessages?.length || 0);
    console.log('[FORCE-SYNC] IDs externos conhecidos:', existingMessageIds.size);
    console.log('[FORCE-SYNC] Hashes de conteúdo:', existingHashes.size);

    // 3. Buscar TODOS os logs do zapi_logs para este telefone
    // Buscar por phone_number que pode ter @s.whatsapp.net ou não
    const { data: zapiLogs, error: logsError } = await supabase
      .from('zapi_logs')
      .select('*')
      .or(`phone_number.eq.${targetPhone},phone_number.eq.${targetPhone}@s.whatsapp.net`)
      .order('created_at', { ascending: true });

    if (logsError) {
      console.error('[FORCE-SYNC] Erro ao buscar zapi_logs:', logsError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Erro ao buscar logs: ${logsError.message}` 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      });
    }

    stats.zapi_logs_total = zapiLogs?.length || 0;
    console.log('[FORCE-SYNC] Logs encontrados em zapi_logs:', stats.zapi_logs_total);

    if (stats.zapi_logs_total === 0) {
      stats.debug_messages.push(`Nenhum log encontrado para telefone ${targetPhone}`);
      return new Response(JSON.stringify({
        success: true,
        stats,
        conversation: {
          id: conversation.id,
          contact_name: conversation.contact_name,
          contact_phone: conversation.contact_phone,
          total_messages: existingMessages?.length || 0
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Processar cada log do zapi_logs
    for (const log of zapiLogs || []) {
      const messageText = log.message_text;
      
      if (!messageText) {
        continue;
      }

      // DEDUPLICAÇÃO 1: Por zapi_message_id
      if (log.zapi_message_id && existingMessageIds.has(log.zapi_message_id)) {
        stats.duplicatas++;
        continue;
      }

      // DEDUPLICAÇÃO 2: Por hash de conteúdo
      const timestamp = new Date(log.created_at).getTime();
      const hash = createDedupeHash(conversation.id, messageText, timestamp);
      
      if (existingHashes.has(hash)) {
        stats.duplicatas++;
        continue;
      }

      // Determinar direção baseado no campo direction do zapi_logs
      // direction em zapi_logs: 'inbound' (cliente enviou) ou 'outbound' (agente enviou)
      const direction = log.direction || 'inbound';
      const fromRole = direction === 'outbound' ? 'agent' : 'contact';

      console.log('[FORCE-SYNC] Inserindo mensagem de zapi_logs:', {
        zapi_message_id: log.zapi_message_id,
        direction,
        text: messageText.slice(0, 50),
        created_at: log.created_at
      });

      // Inserir mensagem
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          body: messageText,
          direction,
          from_role: fromRole,
          external_message_id: log.zapi_message_id,
          created_at: log.created_at,
          topic: 'chat',
          extension: 'whatsapp',
          provider: 'zapi',
          agent_key: agentKey,
          raw_payload: log.raw_payload || { source: 'zapi_logs', log_id: log.id }
        });

      if (insertError) {
        if (insertError.code === '23505') {
          // Unique violation = duplicata
          stats.duplicatas++;
        } else {
          stats.erros++;
          stats.debug_messages.push(`Erro insert: ${insertError.message}`);
          console.error('[FORCE-SYNC] Erro ao inserir:', insertError);
        }
        continue;
      }

      stats.recuperadas++;
      if (direction === 'outbound') {
        stats.outbound++;
      } else {
        stats.inbound++;
      }

      // Adicionar ao set para evitar duplicatas no mesmo batch
      if (log.zapi_message_id) {
        existingMessageIds.add(log.zapi_message_id);
      }
      existingHashes.add(hash);
    }

    // 5. Atualizar contadores de auditoria da conversa
    const { data: updatedCounts } = await supabase
      .from('messages')
      .select('direction')
      .eq('conversation_id', conversation.id);

    const outboundCount = updatedCounts?.filter(m => m.direction === 'outbound').length || 0;
    const inboundCount = updatedCounts?.filter(m => m.direction === 'inbound').length || 0;
    const totalMessages = updatedCounts?.length || 0;

    await supabase
      .from('conversations')
      .update({
        audit_outbound_count: outboundCount,
        audit_inbound_count: inboundCount,
        audit_last_check: new Date().toISOString(),
        audit_sync_issue: false
      })
      .eq('id', conversation.id);

    console.log('[FORCE-SYNC] ====== CONCLUÍDO ======');
    console.log('[FORCE-SYNC] Stats:', stats);

    return new Response(JSON.stringify({
      success: true,
      stats,
      conversation: {
        id: conversation.id,
        contact_name: conversation.contact_name,
        contact_phone: conversation.contact_phone,
        total_messages: totalMessages,
        outbound_count: outboundCount,
        inbound_count: inboundCount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[FORCE-SYNC] Erro fatal:', error);
    return new Response(JSON.stringify({
      success: false,
      error: String(error),
      stats
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
