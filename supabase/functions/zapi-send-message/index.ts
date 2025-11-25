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

    const { agentKey, phone, message, mediaUrl } = await req.json();

    if (!agentKey || !phone || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar configuração do agente
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('key', agentKey)
      .eq('whatsapp_provider', 'zapi')
      .single();

    if (agentError || !agent) {
      console.error('[ZAPI-SEND] Agent not found:', agentKey);
      return new Response(JSON.stringify({ error: 'Agent not configured for Z-API' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const zapiConfig = agent.zapi_config;
    if (!zapiConfig?.instance_id || !zapiConfig?.token) {
      console.error('[ZAPI-SEND] Invalid Z-API config for agent:', agentKey);
      return new Response(JSON.stringify({ error: 'Invalid Z-API configuration' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar Client Token do Z-API
    const zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN');
    
    console.log('[ZAPI-SEND] 🔍 DEBUG - Client Token present:', !!zapiClientToken);
    console.log('[ZAPI-SEND] 🔍 DEBUG - Client Token length:', zapiClientToken?.length || 0);
    
    if (!zapiClientToken) {
      console.error('[ZAPI-SEND] ❌ ZAPI_CLIENT_TOKEN not configured in environment');
      return new Response(JSON.stringify({ error: 'Z-API Client Token not configured in secrets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 🛡️ VERIFICAR DUPLICAÇÃO - evitar envios duplicados (cache + DB)
    // Cache em memória para verificação mais rápida
    const messageHash = `${phone}_${message.substring(0, 100)}`;
    const cacheKey = `dup_${messageHash}`;
    
    // Tentar obter do cache primeiro (mais rápido)
    const cachedTimestamp = await supabase
      .from('agent_context')
      .select('value')
      .eq('key', cacheKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === 'object' && 'timestamp' in data.value) {
          return (data.value as { timestamp: number }).timestamp;
        }
        return null;
      });

    if (cachedTimestamp) {
      const timeDiff = Date.now() - cachedTimestamp;
      if (timeDiff < 3000) { // menos de 3 segundos
        console.log('[ZAPI-SEND] ⚠️ Duplicate blocked (cache):', {
          message: message.substring(0, 30),
          timeDiff: `${timeDiff}ms ago`
        });
        return new Response(JSON.stringify({ 
          success: true, 
          skipped: true, 
          reason: 'duplicate_cache' 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Verificação adicional no banco (backup)
    const { data: conversationForDuplication } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_phone', phone)
      .eq('agent_key', agentKey)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conversationForDuplication) {
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('body, created_at')
        .eq('conversation_id', conversationForDuplication.id)
        .eq('direction', 'outbound')
        .gte('created_at', new Date(Date.now() - 5000).toISOString()) // últimos 5s
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentMessages?.[0]?.body === message) {
        const timeDiff = Date.now() - new Date(recentMessages[0].created_at).getTime();
        if (timeDiff < 3000) { // menos de 3 segundos
          console.log('[ZAPI-SEND] ⚠️ Duplicate blocked (DB):', {
            message: message.substring(0, 30),
            timeDiff: `${timeDiff}ms ago`
          });
          return new Response(JSON.stringify({ 
            success: true, 
            skipped: true, 
            reason: 'duplicate_db' 
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
    }

    // Salvar timestamp no cache para próxima verificação
    await supabase
      .from('agent_context')
      .upsert({ 
        key: cacheKey, 
        value: { timestamp: Date.now() } as any 
      })
      .then(() => {
        // Limpar cache antigo após 10 segundos
        setTimeout(() => {
          supabase.from('agent_context').delete().eq('key', cacheKey).then();
        }, 10000);
      });

    // 🤖 QUEBRAR MENSAGENS LONGAS (humanizar comunicação)
    const splitMessage = (text: string, maxLength = 150): string[] => {
      if (text.length <= maxLength) return [text];
      
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const chunks: string[] = [];
      let currentChunk = '';
      
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length <= maxLength) {
          currentChunk += sentence;
        } else {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = sentence;
        }
      }
      if (currentChunk) chunks.push(currentChunk.trim());
      
      return chunks;
    };

    // 🛡️ ENVIAR COM RETRY (blindagem contra desconexão)
    const sendWithRetry = async (url: string, body: any, retries = 3): Promise<any> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Client-Token': zapiClientToken,
            },
            body: JSON.stringify(body),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          const result = await response.json();

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
          }

          return result;
        } catch (error) {
          console.error(`[ZAPI-SEND] ⚠️ Attempt ${attempt}/${retries} failed:`, error.message);
          
          if (attempt === retries) {
            throw new Error(`Failed after ${retries} attempts: ${error.message}`);
          }
          
          // Esperar antes de tentar novamente (backoff exponencial)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    };

    const messageChunks = splitMessage(message);
    console.log('[ZAPI-SEND] 📤 Sending', messageChunks.length, 'message chunks with retry protection');

    // Enviar cada chunk com delay (simular digitação humana)
    const sendUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
    const results = [];

    for (let i = 0; i < messageChunks.length; i++) {
      const chunk = messageChunks[i];
      
      console.log('[ZAPI-SEND] 📤 Chunk', i + 1, '/', messageChunks.length, ':', {
        agent: agentKey,
        phone,
        preview: chunk.substring(0, 50) + '...',
        length: chunk.length,
        timestamp: new Date().toISOString()
      });

      try {
        const chunkResult = await sendWithRetry(sendUrl, {
          phone: phone.replace(/\D/g, ''),
          message: chunk
        });

        results.push(chunkResult);
        console.log('[ZAPI-SEND] ✅ Chunk', i + 1, 'sent successfully');

        // Delay entre mensagens (exceto última)
        if (i < messageChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      } catch (error) {
        console.error('[ZAPI-SEND] ❌ Failed to send chunk', i + 1, ':', error.message);
        
        // Log falha
        await supabase.from('zapi_logs').insert({
          agent_key: agentKey,
          direction: 'outbound',
          phone_number: phone,
          message_text: chunk,
          status: 'failed',
          error_message: error.message,
          metadata: { error: error.message, chunkIndex: i, totalChunks: messageChunks.length }
        });
        
        throw error; // Propagar erro para catch principal
      }
    }

    const zapiResult = results[results.length - 1]; // Último resultado para messageId

    console.log('[ZAPI-SEND] ✅ All chunks sent successfully:', {
      totalChunks: messageChunks.length,
      lastMessageId: zapiResult.messageId,
      phone,
      agent: agentKey,
      timestamp: new Date().toISOString()
    });

    // Log sucesso com informação de chunks
    await supabase.from('zapi_logs').insert({
      agent_key: agentKey,
      direction: 'outbound',
      phone_number: phone,
      message_text: message, // Mensagem completa
      media_url: mediaUrl || null,
      status: 'sent',
      zapi_message_id: zapiResult.messageId || null,
      metadata: { 
        response: zapiResult,
        totalChunks: messageChunks.length,
        allResults: results
      }
    });

    // ✅ FASE 1: SALVAR EM MESSAGES PARA APARECER NO CRM
    console.log('[ZAPI-SEND] 💾 Saving outbound message to messages table...');
    
    // Buscar conversation_id baseado em phone + agent
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, agent_key')
      .eq('contact_phone', phone)
      .eq('agent_key', agentKey)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 🤖 FASE 4: Verificar se é Eduardo enviando em conversa da Sofia
    if (conversation && agentKey === 'eduardo') {
      // Buscar se existe conversa da Sofia com este telefone
      const { data: sofiaConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_phone', phone)
        .eq('agent_key', 'sofia')
        .maybeSingle();
      
      if (sofiaConversation) {
        console.log('[ZAPI-SEND] 🛑 Pausando Sofia - Eduardo assumiu a conversa');
        
        // Pausar Sofia nesta conversa
        await supabase
          .from('conversations')
          .update({ sofia_paused: true })
          .eq('id', sofiaConversation.id);
      }
    }

    if (conversation) {
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        agent_key: agentKey,
        provider: 'zapi',
        direction: 'outbound',
        from_role: 'agent',
        body: message, // Mensagem completa
        is_automated: true,
        raw_payload: { 
          zapi_message_id: zapiResult.messageId,
          sent_at: new Date().toISOString(),
          media_url: mediaUrl || null,
          sentInChunks: messageChunks.length > 1,
          totalChunks: messageChunks.length
        }
      });
      
      console.log('[ZAPI-SEND] ✅ Outbound message saved (chunks:', messageChunks.length, ')');
    } else {
      console.warn('[ZAPI-SEND] ⚠️ No conversation found for phone:', phone);
    }

    // Log no agent_logs também
    await supabase.from('agent_logs').insert({
      agent_key: agentKey,
      event_type: 'message_sent',
      metadata: {
        phone,
        messageId: zapiResult.messageId,
        provider: 'zapi'
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      messageId: zapiResult.messageId,
      zapiResponse: zapiResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ZAPI-SEND] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
