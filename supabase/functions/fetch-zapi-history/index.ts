import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZAPIMessage {
  messageId: string;
  phone: string;
  fromMe: boolean;
  momment: number;
  status: string;
  chatName: string;
  senderPhoto?: string;
  senderName?: string;
  participantPhone?: string;
  text?: {
    message: string;
  };
  image?: any;
  audio?: any;
  document?: any;
  video?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const stats = {
    agent_used: '',
    contacts_processed: 0,
    messages_fetched_from_zapi: 0,
    messages_synced: 0,
    messages_outbound_synced: 0,
    messages_inbound_synced: 0,
    duplicates_skipped: 0,
    chats_found: 0,
    errors: [] as string[]
  };

  try {
    // Parsear body da requisição para parâmetros opcionais
    let agentKey: string | null = null;
    let fromDate: Date | null = null;
    let toDate: Date | null = null;
    let limitConversations: number | null = null;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        agentKey = body.agent_key || null; // 'eduardo', 'sofia', ou null para ambos
        fromDate = body.from_date ? new Date(body.from_date) : null;
        toDate = body.to_date ? new Date(body.to_date) : null;
        limitConversations = body.limit || null;
        
        console.log('📥 [FETCH-ZAPI-HISTORY] Parâmetros recebidos:', { 
          agentKey, 
          fromDate: fromDate?.toISOString(), 
          toDate: toDate?.toISOString(),
          limitConversations 
        });
      } catch (e) {
        console.log('📥 [FETCH-ZAPI-HISTORY] Sem body ou body inválido, usando defaults');
      }
    }

    console.log('🔄 [FETCH-ZAPI-HISTORY] Iniciando busca de histórico do Z-API (Multi-Device Compatible)');

    // Buscar configuração do agente específico ou todos com Z-API
    let agentsQuery = supabase
      .from('agents')
      .select('key, zapi_config, whatsapp_number');
    
    if (agentKey) {
      agentsQuery = agentsQuery.eq('key', agentKey);
    } else {
      agentsQuery = agentsQuery.in('key', ['sofia', 'eduardo']);
    }

    const { data: agents, error: agentsError } = await agentsQuery;

    if (agentsError) {
      throw new Error(`Erro ao buscar agentes: ${agentsError.message}`);
    }

    // Encontrar agente com Z-API configurado
    const agentWithZapi = agents?.find(a => a.zapi_config);
    if (!agentWithZapi) {
      throw new Error(`Nenhum agente ${agentKey || ''} com Z-API configurado`);
    }

    const zapiConfig = agentWithZapi.zapi_config as { instance_id: string; token: string };
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (!zapiConfig?.instance_id || !zapiConfig?.token) {
      throw new Error('Configuração Z-API incompleta');
    }

    stats.agent_used = agentWithZapi.key;
    console.log(`📱 [FETCH-ZAPI-HISTORY] Usando agente: ${agentWithZapi.key} (Instance: ${zapiConfig.instance_id})`);

    // ESTRATÉGIA MULTI-DEVICE: Usar endpoint /chats para listar conversas do Z-API
    // e depois /load-earlier-messages para buscar mensagens
    const chatsUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/chats`;
    
    console.log('📋 [FETCH-ZAPI-HISTORY] Buscando lista de chats do Z-API...');
    
    const chatsResponse = await fetch(chatsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(zapiClientToken && { 'Client-Token': zapiClientToken })
      }
    });

    if (!chatsResponse.ok) {
      const errorText = await chatsResponse.text();
      throw new Error(`Erro ao buscar chats: ${chatsResponse.status} - ${errorText}`);
    }

    const zapiChats = await chatsResponse.json();
    
    if (!Array.isArray(zapiChats)) {
      throw new Error('Resposta de chats inválida');
    }

    stats.chats_found = zapiChats.length;
    console.log(`✅ [FETCH-ZAPI-HISTORY] ${zapiChats.length} chats encontrados no Z-API`);

    // Buscar conversas existentes no banco
    let conversationsQuery = supabase
      .from('conversations')
      .select('id, contact_phone, agent_key');
    
    if (agentKey) {
      conversationsQuery = conversationsQuery.eq('agent_key', agentKey);
    }

    const { data: conversations, error: convError } = await conversationsQuery;

    if (convError) {
      throw new Error(`Erro ao buscar conversas: ${convError.message}`);
    }

    // Criar mapa de telefone -> conversa
    const phoneToConversation = new Map<string, { id: string; agent_key: string }>();
    for (const conv of conversations || []) {
      if (conv.contact_phone) {
        const cleanPhone = conv.contact_phone.replace(/\D/g, '');
        phoneToConversation.set(cleanPhone, { id: conv.id, agent_key: conv.agent_key });
      }
    }

    console.log(`📊 [FETCH-ZAPI-HISTORY] ${conversations?.length || 0} conversas no banco para ${agentKey || 'todos os agentes'}`);

    // Buscar mensagens existentes para evitar duplicatas
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id, external_message_id, body, conversation_id');

    const existingExternalIds = new Set(
      existingMessages?.map(m => m.external_message_id).filter(Boolean) || []
    );
    const existingBodyMap = new Map(
      existingMessages?.map(m => [`${m.body}_${m.conversation_id}`, m.id]) || []
    );

    // Processar cada chat do Z-API
    const chatsToProcess = limitConversations ? zapiChats.slice(0, limitConversations) : zapiChats;
    
    for (const chat of chatsToProcess) {
      const phone = chat.phone?.replace(/\D/g, '') || chat.id?.split('@')[0]?.replace(/\D/g, '');
      
      if (!phone) continue;
      
      // Verificar se existe conversa no banco
      let conversationId = phoneToConversation.get(phone)?.id;
      
      // Se não existe conversa, criar uma nova
      if (!conversationId) {
        console.log(`🆕 [FETCH-ZAPI-HISTORY] Criando nova conversa para: ${phone}`);
        
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            contact_phone: phone,
            contact_name: chat.name || chat.chatName || phone,
            agent_key: agentKey || 'eduardo',
            status: 'open'
          })
          .select('id')
          .single();

        if (createError) {
          console.warn(`⚠️ Erro ao criar conversa para ${phone}: ${createError.message}`);
          stats.errors.push(`Create conv ${phone}: ${createError.message}`);
          continue;
        }

        conversationId = newConv.id;
        phoneToConversation.set(phone, { id: conversationId, agent_key: agentKey || 'eduardo' });
      }
      
      stats.contacts_processed++;
      
      try {
        console.log(`📞 [FETCH-ZAPI-HISTORY] Processando mensagens de: ${phone}`);

        // Usar endpoint load-earlier-messages que funciona com multi-device
        const messagesUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/load-earlier-messages`;
        
        const messagesResponse = await fetch(messagesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(zapiClientToken && { 'Client-Token': zapiClientToken })
          },
          body: JSON.stringify({
            phone: phone,
            messageId: null, // null para buscar desde o início
            count: 50 // Buscar últimas 50 mensagens
          })
        });

        if (!messagesResponse.ok) {
          const errorText = await messagesResponse.text();
          console.warn(`⚠️ [FETCH-ZAPI-HISTORY] Erro Z-API para ${phone}: ${messagesResponse.status} - ${errorText}`);
          stats.errors.push(`${phone}: ${messagesResponse.status}`);
          continue;
        }

        const zapiMessages: ZAPIMessage[] = await messagesResponse.json();
        
        if (!Array.isArray(zapiMessages)) {
          console.warn(`⚠️ [FETCH-ZAPI-HISTORY] Resposta inválida para ${phone}`);
          continue;
        }

        stats.messages_fetched_from_zapi += zapiMessages.length;
        console.log(`✅ [FETCH-ZAPI-HISTORY] ${zapiMessages.length} mensagens do Z-API para ${phone}`);

        // Processar cada mensagem
        for (const msg of zapiMessages) {
          // Calcular data da mensagem
          const messageDate = new Date(msg.momment * 1000);
          
          // Filtrar por período se especificado
          if (fromDate && messageDate < fromDate) {
            continue;
          }
          if (toDate && messageDate > toDate) {
            continue;
          }

          // Pular se já existe
          if (msg.messageId && existingExternalIds.has(msg.messageId)) {
            stats.duplicates_skipped++;
            continue;
          }

          const messageText = msg.text?.message || 
            (msg.image ? '[Imagem]' : '') ||
            (msg.audio ? '[Áudio]' : '') ||
            (msg.document ? '[Documento]' : '') ||
            (msg.video ? '[Vídeo]' : '');

          if (!messageText) continue;

          // Verificar duplicata por conteúdo
          const bodyKey = `${messageText}_${conversationId}`;
          if (existingBodyMap.has(bodyKey)) {
            stats.duplicates_skipped++;
            continue;
          }

          const direction = msg.fromMe ? 'outbound' : 'inbound';
          const createdAt = messageDate.toISOString();

          // Inserir mensagem
          const { error: insertError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              body: messageText,
              direction,
              external_message_id: msg.messageId,
              from_role: msg.fromMe ? 'agent' : 'contact',
              created_at: createdAt
            });

          if (insertError) {
            // Se for erro de duplicata, ignorar silenciosamente
            if (insertError.code === '23505') {
              stats.duplicates_skipped++;
            } else {
              console.warn(`⚠️ Erro ao inserir: ${insertError.message}`);
            }
            continue;
          }

          stats.messages_synced++;
          if (direction === 'outbound') {
            stats.messages_outbound_synced++;
          } else {
            stats.messages_inbound_synced++;
          }

          // Adicionar ao mapa para evitar duplicatas no mesmo batch
          existingExternalIds.add(msg.messageId);
          existingBodyMap.set(bodyKey, 'inserted');
        }

        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (chatError) {
        console.error(`❌ Erro ao processar chat ${phone}:`, chatError);
        stats.errors.push(`Chat ${phone}: ${chatError}`);
      }
    }

    // Atualizar contadores de auditoria nas conversas processadas
    if (stats.messages_synced > 0) {
      console.log('🔄 [FETCH-ZAPI-HISTORY] Atualizando contadores de auditoria...');
      
      try {
        // Recalcular contadores para conversas que tiveram mensagens sincronizadas
        const { error: auditError } = await supabase.rpc('update_conversation_audit_counts');
        
        if (auditError) {
          console.warn(`⚠️ Erro ao atualizar auditoria: ${auditError.message}`);
        } else {
          console.log('✅ [FETCH-ZAPI-HISTORY] Contadores de auditoria atualizados');
        }
      } catch (e) {
        console.warn('⚠️ Função update_conversation_audit_counts não encontrada');
      }
    }

    const duration = Date.now() - startTime;

    console.log('✅ [FETCH-ZAPI-HISTORY] Concluído:', {
      duration_ms: duration,
      ...stats
    });

    return new Response(JSON.stringify({
      success: true,
      duration_ms: duration,
      stats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [FETCH-ZAPI-HISTORY] Erro:', error);
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
