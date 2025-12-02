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

interface ZAPIResponse {
  messages: ZAPIMessage[];
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
    contacts_processed: 0,
    messages_fetched_from_zapi: 0,
    messages_synced: 0,
    messages_outbound_synced: 0,
    messages_inbound_synced: 0,
    duplicates_skipped: 0,
    errors: [] as string[]
  };

  try {
    console.log('🔄 [FETCH-ZAPI-HISTORY] Iniciando busca de histórico do Z-API');

    // Buscar configuração do agente Eduardo
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('key, zapi_config, whatsapp_number')
      .in('key', ['sofia_exa', 'eduardo_exa']);

    if (agentsError) {
      throw new Error(`Erro ao buscar agentes: ${agentsError.message}`);
    }

    // Encontrar agente com Z-API configurado
    const agentWithZapi = agents?.find(a => a.zapi_config);
    if (!agentWithZapi) {
      throw new Error('Nenhum agente com Z-API configurado');
    }

    const zapiConfig = agentWithZapi.zapi_config as { instance_id: string; token: string };
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');

    if (!zapiConfig?.instance_id || !zapiConfig?.token) {
      throw new Error('Configuração Z-API incompleta');
    }

    console.log(`📱 [FETCH-ZAPI-HISTORY] Usando agente: ${agentWithZapi.key}`);

    // Buscar todas as conversas existentes
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, contact_phone, agent_key');

    if (convError) {
      throw new Error(`Erro ao buscar conversas: ${convError.message}`);
    }

    console.log(`📊 [FETCH-ZAPI-HISTORY] ${conversations?.length || 0} conversas encontradas`);

    // Buscar mensagens existentes para evitar duplicatas
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id, external_message_id, body, conversation_id, created_at');

    const existingExternalIds = new Set(
      existingMessages?.map(m => m.external_message_id).filter(Boolean) || []
    );
    const existingBodyMap = new Map(
      existingMessages?.map(m => [`${m.body}_${m.conversation_id}`, m.id]) || []
    );

    // Processar cada conversa
    for (const conv of conversations || []) {
      if (!conv.contact_phone) continue;
      
      stats.contacts_processed++;
      
      try {
        // Formatar telefone para Z-API (apenas números)
        const phone = conv.contact_phone.replace(/\D/g, '');
        
        console.log(`📞 [FETCH-ZAPI-HISTORY] Buscando histórico para: ${phone}`);

        // Chamar Z-API para buscar mensagens do chat
        const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/chat-messages/${phone}`;
        
        const response = await fetch(zapiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(zapiClientToken && { 'Client-Token': zapiClientToken })
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`⚠️ [FETCH-ZAPI-HISTORY] Erro Z-API para ${phone}: ${response.status} - ${errorText}`);
          stats.errors.push(`${phone}: ${response.status}`);
          continue;
        }

        const zapiMessages: ZAPIMessage[] = await response.json();
        
        if (!Array.isArray(zapiMessages)) {
          console.warn(`⚠️ [FETCH-ZAPI-HISTORY] Resposta inválida para ${phone}`);
          continue;
        }

        stats.messages_fetched_from_zapi += zapiMessages.length;
        console.log(`✅ [FETCH-ZAPI-HISTORY] ${zapiMessages.length} mensagens do Z-API para ${phone}`);

        // Processar cada mensagem
        for (const msg of zapiMessages) {
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
          const bodyKey = `${messageText}_${conv.id}`;
          if (existingBodyMap.has(bodyKey)) {
            stats.duplicates_skipped++;
            continue;
          }

          const direction = msg.fromMe ? 'outbound' : 'inbound';
          const createdAt = new Date(msg.momment * 1000).toISOString();

          // Inserir mensagem
          const { error: insertError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conv.id,
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
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (convError) {
        console.error(`❌ Erro ao processar conversa ${conv.id}:`, convError);
        stats.errors.push(`Conv ${conv.id}: ${convError}`);
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
