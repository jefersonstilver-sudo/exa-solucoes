import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Criar hash para deduplicação (base64 de conversation_id + body normalizado + timestamp arredondado)
function createDedupeHash(conversationId: string, body: string, timestamp: number): string {
  const normalizedBody = body.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
  const roundedTs = Math.floor(timestamp / 60000); // Arredondar para minuto
  const data = `${conversationId}|${normalizedBody}|${roundedTs}`;
  try {
    return btoa(unescape(encodeURIComponent(data))).slice(0, 48);
  } catch {
    // Fallback para strings com caracteres especiais
    return btoa(encodeURIComponent(data).replace(/%/g, '_')).slice(0, 48);
  }
}

// Limpar telefone para formato Z-API
function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '').replace('@s.whatsapp.net', '');
}

interface ZAPIMessage {
  messageId: string;
  phone: string;
  fromMe: boolean;
  momment: number;
  status?: string;
  chatName?: string;
  text?: { message: string };
  image?: { caption?: string };
  audio?: any;
  document?: { caption?: string };
  video?: { caption?: string };
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
    zapi_total: 0,
    zapi_response_status: 0,
    debug_messages: [] as string[]
  };

  try {
    const { conversationId, phone, agentKey } = await req.json();
    
    console.log('[FORCE-SYNC] ====== INICIANDO ======');
    console.log('[FORCE-SYNC] Input:', { conversationId, phone, agentKey });

    // 1. Buscar conversa
    let conversation;
    if (conversationId) {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();
      
      if (error) {
        console.error('[FORCE-SYNC] Erro ao buscar conversa:', error);
        throw new Error(`Conversa não encontrada: ${error.message}`);
      }
      conversation = data;
    }

    if (!conversation) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Conversa não encontrada' 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404 
      });
    }

    const targetPhone = cleanPhone(conversation.contact_phone);
    const targetAgentKey = agentKey || conversation.agent_key || 'eduardo';

    console.log('[FORCE-SYNC] Conversa encontrada:', {
      id: conversation.id,
      contact_name: conversation.contact_name,
      phone: targetPhone,
      agent: targetAgentKey
    });

    // 2. Buscar config Z-API (tentar agente da conversa, depois eduardo, depois sofia)
    const agentsToTry = [targetAgentKey, 'eduardo', 'sofia'].filter((v, i, a) => a.indexOf(v) === i);
    let zapiConfig: { instance_id: string; token: string } | null = null;
    let usedAgent = '';

    for (const agKey of agentsToTry) {
      const { data: agent } = await supabase
        .from('agents')
        .select('key, zapi_config')
        .eq('key', agKey)
        .single();
      
      if (agent?.zapi_config?.instance_id && agent?.zapi_config?.token) {
        zapiConfig = agent.zapi_config;
        usedAgent = agKey;
        console.log('[FORCE-SYNC] Config Z-API encontrada no agente:', agKey);
        break;
      }
    }

    if (!zapiConfig) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Nenhum agente com Z-API configurado encontrado' 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      });
    }

    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    // 3. Buscar mensagens existentes para criar sets de deduplicação
    const { data: existingMessages, error: msgError } = await supabase
      .from('messages')
      .select('id, external_message_id, body, created_at')
      .eq('conversation_id', conversation.id);

    if (msgError) {
      console.error('[FORCE-SYNC] Erro ao buscar mensagens existentes:', msgError);
    }

    const existingMessageIds = new Set<string>();
    const existingHashes = new Set<string>();

    for (const msg of existingMessages || []) {
      if (msg.external_message_id) {
        existingMessageIds.add(msg.external_message_id);
      }
      // Criar hash para deduplicação por conteúdo
      if (msg.body && msg.created_at) {
        const ts = new Date(msg.created_at).getTime();
        const hash = createDedupeHash(conversation.id, msg.body, ts);
        existingHashes.add(hash);
      }
    }

    console.log('[FORCE-SYNC] Mensagens existentes:', existingMessages?.length || 0);
    console.log('[FORCE-SYNC] IDs externos únicos:', existingMessageIds.size);
    console.log('[FORCE-SYNC] Hashes de conteúdo:', existingHashes.size);

    // 4. Chamar Z-API para buscar histórico (últimas 50 mensagens)
    const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/chat-messages/${targetPhone}?amount=50`;
    
    console.log('[FORCE-SYNC] Chamando Z-API:', zapiUrl.replace(zapiConfig.token, '***'));

    const zapiResponse = await fetch(zapiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(zapiClientToken && { 'Client-Token': zapiClientToken })
      }
    });

    stats.zapi_response_status = zapiResponse.status;

    if (!zapiResponse.ok) {
      const errorText = await zapiResponse.text();
      console.error('[FORCE-SYNC] Erro Z-API:', zapiResponse.status, errorText);
      stats.debug_messages.push(`Z-API error: ${zapiResponse.status} - ${errorText.slice(0, 200)}`);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Erro Z-API: ${zapiResponse.status}`,
        details: errorText.slice(0, 500),
        stats 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 502 
      });
    }

    const zapiData = await zapiResponse.json();
    
    // Z-API pode retornar array direto ou objeto com messages
    const zapiMessages: ZAPIMessage[] = Array.isArray(zapiData) 
      ? zapiData 
      : (zapiData.messages || []);

    stats.zapi_total = zapiMessages.length;
    console.log('[FORCE-SYNC] Mensagens retornadas do Z-API:', stats.zapi_total);

    if (stats.zapi_total === 0) {
      stats.debug_messages.push('Z-API retornou 0 mensagens');
      console.log('[FORCE-SYNC] Resposta Z-API:', JSON.stringify(zapiData).slice(0, 500));
    }

    // 5. Processar cada mensagem do Z-API
    for (const msg of zapiMessages) {
      // Extrair texto da mensagem
      const messageText = msg.text?.message || 
        msg.image?.caption || 
        msg.document?.caption ||
        msg.video?.caption ||
        (msg.image ? '[Imagem]' : '') ||
        (msg.audio ? '[Áudio]' : '') ||
        (msg.document ? '[Documento]' : '') ||
        (msg.video ? '[Vídeo]' : '');

      if (!messageText) {
        stats.debug_messages.push(`Mensagem sem texto pulada: ${msg.messageId}`);
        continue;
      }

      // DEDUPLICAÇÃO 1: Por messageId (mais confiável)
      if (msg.messageId && existingMessageIds.has(msg.messageId)) {
        stats.duplicatas++;
        continue;
      }

      // DEDUPLICAÇÃO 2: Por hash de conteúdo (backup)
      const timestamp = msg.momment * 1000; // momment está em segundos
      const hash = createDedupeHash(conversation.id, messageText, timestamp);
      
      if (existingHashes.has(hash)) {
        stats.duplicatas++;
        continue;
      }

      // Determinar direção baseado no fromMe
      const direction = msg.fromMe ? 'outbound' : 'inbound';
      const fromRole = msg.fromMe ? 'agent' : 'contact';

      console.log('[FORCE-SYNC] Inserindo mensagem:', {
        messageId: msg.messageId,
        direction,
        fromMe: msg.fromMe,
        text: messageText.slice(0, 50)
      });

      // Inserir mensagem
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          body: messageText,
          direction,
          from_role: fromRole,
          external_message_id: msg.messageId,
          created_at: new Date(timestamp).toISOString(),
          topic: 'chat',
          extension: 'whatsapp',
          provider: 'zapi',
          agent_key: usedAgent,
          raw_payload: msg
        });

      if (insertError) {
        // Código 23505 = unique violation (duplicata de BD)
        if (insertError.code === '23505') {
          stats.duplicatas++;
          console.log('[FORCE-SYNC] Duplicata detectada pelo BD:', msg.messageId);
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
      if (msg.messageId) {
        existingMessageIds.add(msg.messageId);
      }
      existingHashes.add(hash);
    }

    // 6. Atualizar contadores de auditoria da conversa
    const { data: updatedCounts } = await supabase
      .from('messages')
      .select('direction')
      .eq('conversation_id', conversation.id);

    const outboundCount = updatedCounts?.filter(m => m.direction === 'outbound').length || 0;
    const inboundCount = updatedCounts?.filter(m => m.direction === 'inbound').length || 0;
    const totalMessages = (updatedCounts?.length || 0);

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
    console.log('[FORCE-SYNC] Stats finais:', stats);

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
