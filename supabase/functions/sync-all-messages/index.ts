import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResult {
  success: boolean;
  timestamp: string;
  duration_ms: number;
  stats: {
    zapi_logs_total: number;
    messages_total: number;
    conversations_total: number;
    messages_recovered: number;
    messages_inbound_recovered: number;
    messages_outbound_recovered: number;
    conversations_created: number;
    duplicates_fixed: number;
    orphan_logs_found: number;
    errors: string[];
  };
  agents: {
    sofia: { conversations: number; messages: number; recovered: number };
    eduardo: { conversations: number; messages: number; recovered: number };
    others: { conversations: number; messages: number; recovered: number };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const errors: string[] = [];

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 [SYNC-ALL] Iniciando sincronização completa de mensagens...');

    // ========== FASE 1: Auditoria do Estado Atual ==========
    console.log('📊 [SYNC-ALL] FASE 1: Auditoria do estado atual...');

    // Contar registros atuais
    const { count: zapiLogsTotal } = await supabase
      .from('zapi_logs')
      .select('*', { count: 'exact', head: true });

    const { count: messagesTotal } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    const { count: conversationsTotal } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 [SYNC-ALL] Estado inicial: ${zapiLogsTotal} zapi_logs, ${messagesTotal} messages, ${conversationsTotal} conversations`);

    // ========== FASE 2: Identificar Mensagens Órfãs em zapi_logs ==========
    console.log('🔍 [SYNC-ALL] FASE 2: Identificando mensagens órfãs...');

    // Buscar todos os zapi_logs com mensagens
    const { data: allZapiLogs, error: zapiError } = await supabase
      .from('zapi_logs')
      .select('id, zapi_message_id, phone_number, message_text, direction, agent_key, created_at, metadata')
      .not('message_text', 'is', null)
      .order('created_at', { ascending: false });

    if (zapiError) {
      console.error('❌ [SYNC-ALL] Erro ao buscar zapi_logs:', zapiError);
      errors.push(`Erro zapi_logs: ${zapiError.message}`);
    }

    // Buscar todas as mensagens existentes com seus IDs externos
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id, external_message_id, body, conversation_id');

    const existingExternalIds = new Set(existingMessages?.map(m => m.external_message_id).filter(Boolean) || []);
    const existingBodies = new Map(existingMessages?.map(m => [m.body + '_' + m.conversation_id, m.id]) || []);

    console.log(`📊 [SYNC-ALL] ${existingExternalIds.size} external_ids conhecidos, ${existingBodies.size} mensagens únicas`);

    // ========== FASE 3: Buscar/Criar Conversas e Sincronizar Mensagens ==========
    console.log('🔧 [SYNC-ALL] FASE 3: Sincronizando mensagens...');

    let messagesRecovered = 0;
    let messagesInboundRecovered = 0;
    let messagesOutboundRecovered = 0;
    let conversationsCreated = 0;
    let duplicatesFixed = 0;
    let orphanLogsFound = 0;

    const agentStats = {
      sofia: { conversations: 0, messages: 0, recovered: 0 },
      eduardo: { conversations: 0, messages: 0, recovered: 0 },
      others: { conversations: 0, messages: 0, recovered: 0 }
    };

    // Agrupar logs por telefone e agente
    const logsByPhoneAgent = new Map<string, typeof allZapiLogs>();
    
    for (const log of allZapiLogs || []) {
      if (!log.phone_number || !log.message_text) continue;
      
      const key = `${log.phone_number}_${log.agent_key || 'unknown'}`;
      if (!logsByPhoneAgent.has(key)) {
        logsByPhoneAgent.set(key, []);
      }
      logsByPhoneAgent.get(key)!.push(log);
    }

    console.log(`📊 [SYNC-ALL] ${logsByPhoneAgent.size} combinações telefone/agente encontradas`);

    for (const [key, logs] of logsByPhoneAgent) {
      const [phone, agentKey] = key.split('_');
      
      // Buscar ou criar conversa
      let { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_phone', phone)
        .eq('agent_key', agentKey)
        .maybeSingle();

      if (!conversation) {
        // Criar conversa se não existir
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            contact_phone: phone,
            agent_key: agentKey,
            contact_name: `Contato ${phone.slice(-4)}`,
            status: 'open',
            last_message_at: logs[0]?.created_at || new Date().toISOString()
          })
          .select('id')
          .single();

        if (convError) {
          console.error(`❌ [SYNC-ALL] Erro ao criar conversa para ${phone}:`, convError);
          errors.push(`Criar conversa ${phone}: ${convError.message}`);
          continue;
        }

        conversation = newConv;
        conversationsCreated++;
        console.log(`✅ [SYNC-ALL] Conversa criada para ${phone} (${agentKey})`);
      }

      // Atualizar stats por agente
      const agentStatKey = agentKey === 'sofia' ? 'sofia' : agentKey === 'eduardo' ? 'eduardo' : 'others';
      agentStats[agentStatKey].conversations++;

      // Processar cada log e verificar se precisa ser inserido em messages
      for (const log of logs) {
        agentStats[agentStatKey].messages++;

        // Verificar se já existe
        const messageKey = log.message_text + '_' + conversation.id;
        if (existingExternalIds.has(log.zapi_message_id) || existingBodies.has(messageKey)) {
          continue; // Já existe
        }

        orphanLogsFound++;

        // Determinar direção
        const metadata = log.metadata as any;
        const isFromMe = metadata?.fromMe === true;
        const direction = isFromMe ? 'outbound' : (log.direction || 'inbound');

        // Inserir mensagem
        const { error: insertError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            body: log.message_text,
            direction: direction,
            external_message_id: log.zapi_message_id,
            from_role: direction === 'outbound' ? 'agent' : 'contact',
            created_at: log.created_at,
            raw_payload: log.metadata
          });

        if (insertError) {
          // Pode ser duplicata por constraint
          if (insertError.code === '23505') {
            duplicatesFixed++;
          } else {
            console.error(`❌ [SYNC-ALL] Erro ao inserir mensagem:`, insertError);
            errors.push(`Inserir msg: ${insertError.message}`);
          }
        } else {
          messagesRecovered++;
          agentStats[agentStatKey].recovered++;
          
          if (direction === 'inbound') {
            messagesInboundRecovered++;
          } else {
            messagesOutboundRecovered++;
          }

          console.log(`✅ [SYNC-ALL] Mensagem recuperada: ${log.message_text?.substring(0, 30)}... (${direction})`);
        }
      }
    }

    // ========== FASE 4: Corrigir direção de mensagens do Eduardo ==========
    console.log('🔧 [SYNC-ALL] FASE 4: Corrigindo direção de mensagens...');

    const { data: eduardoMessages } = await supabase
      .from('messages')
      .select(`
        id,
        direction,
        raw_payload,
        conversations!inner(agent_key)
      `)
      .eq('conversations.agent_key', 'eduardo');

    let directionFixed = 0;
    for (const msg of eduardoMessages || []) {
      const rawPayload = msg.raw_payload as any;
      if (rawPayload?.fromMe === true && msg.direction === 'inbound') {
        await supabase
          .from('messages')
          .update({ direction: 'outbound', from_role: 'agent' })
          .eq('id', msg.id);
        directionFixed++;
      }
    }

    if (directionFixed > 0) {
      console.log(`✅ [SYNC-ALL] ${directionFixed} mensagens com direção corrigida`);
    }

    // ========== FASE 5: Atualizar last_message_at das conversas ==========
    console.log('🔧 [SYNC-ALL] FASE 5: Atualizando timestamps das conversas...');

    const { data: allConversations } = await supabase
      .from('conversations')
      .select('id');

    for (const conv of allConversations || []) {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastMsg) {
        await supabase
          .from('conversations')
          .update({ last_message_at: lastMsg.created_at })
          .eq('id', conv.id);
      }
    }

    // ========== RESULTADO FINAL ==========
    const { count: finalMessagesTotal } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    const { count: finalConversationsTotal } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    // Contar por agente
    const { count: sofiaConvs } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('agent_key', 'sofia');

    const { count: eduardoConvs } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('agent_key', 'eduardo');

    const { count: sofiaMsgs } = await supabase
      .from('messages')
      .select('*, conversations!inner(agent_key)', { count: 'exact', head: true })
      .eq('conversations.agent_key', 'sofia');

    const { count: eduardoMsgs } = await supabase
      .from('messages')
      .select('*, conversations!inner(agent_key)', { count: 'exact', head: true })
      .eq('conversations.agent_key', 'eduardo');

    const duration = Date.now() - startTime;

    const result: SyncResult = {
      success: errors.length === 0,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      stats: {
        zapi_logs_total: zapiLogsTotal || 0,
        messages_total: finalMessagesTotal || 0,
        conversations_total: finalConversationsTotal || 0,
        messages_recovered: messagesRecovered,
        messages_inbound_recovered: messagesInboundRecovered,
        messages_outbound_recovered: messagesOutboundRecovered,
        conversations_created: conversationsCreated,
        duplicates_fixed: duplicatesFixed,
        orphan_logs_found: orphanLogsFound,
        errors
      },
      agents: {
        sofia: { 
          conversations: sofiaConvs || 0, 
          messages: sofiaMsgs || 0, 
          recovered: agentStats.sofia.recovered 
        },
        eduardo: { 
          conversations: eduardoConvs || 0, 
          messages: eduardoMsgs || 0, 
          recovered: agentStats.eduardo.recovered 
        },
        others: { 
          conversations: (finalConversationsTotal || 0) - (sofiaConvs || 0) - (eduardoConvs || 0), 
          messages: (finalMessagesTotal || 0) - (sofiaMsgs || 0) - (eduardoMsgs || 0), 
          recovered: agentStats.others.recovered 
        }
      }
    };

    console.log('🎉 [SYNC-ALL] Sincronização completa!', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ [SYNC-ALL] Erro fatal:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        error: error.message,
        stats: {
          zapi_logs_total: 0,
          messages_total: 0,
          conversations_total: 0,
          messages_recovered: 0,
          messages_inbound_recovered: 0,
          messages_outbound_recovered: 0,
          conversations_created: 0,
          duplicates_fixed: 0,
          orphan_logs_found: 0,
          errors: [error.message]
        },
        agents: {
          sofia: { conversations: 0, messages: 0, recovered: 0 },
          eduardo: { conversations: 0, messages: 0, recovered: 0 },
          others: { conversations: 0, messages: 0, recovered: 0 }
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
