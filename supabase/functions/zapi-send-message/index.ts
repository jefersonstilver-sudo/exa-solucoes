// CRITICAL FIX: 2025-11-28T04:38:00Z - Body read fix + skipSplit implementation
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Normaliza telefone brasileiro para o formato que Evolution e Z-API esperam.
 * Exemplos:
 *   "45998090000"     -> "5545998090000"
 *   "5545998090000"   -> "5545998090000"
 *   "+55 45 99809..." -> "5545998090000"
 *   "554598090000"    -> "554598090000" (já internacional)
 * Mantém intactos números que já parecem ter outro DDI válido (595/54/598/56/1).
 */
function normalizePhoneBR(input: string): string {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) return digits;
  // 10 ou 11 dígitos = local BR sem DDI -> prefixa 55
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  // 12/13 dígitos começando com 55 = BR já internacional
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) return digits;
  // Outros DDIs latam/US (mantém)
  if (/^(595|598|54|56|1)/.test(digits)) return digits;
  // Fallback: se tem 8-9 dígitos puros, não dá pra adivinhar -> retorna como está
  return digits;
}

serve(async (req) => {
  // 🔍 INICIO DA FUNÇÃO
  console.log('[ZAPI-SEND] 🚀 Function started - Version: 2026-06-09T20:55:00Z');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ✅ LER BODY UMA ÚNICA VEZ
    const requestBody = await req.json();
    console.log('[ZAPI-SEND] 📥 Request received:', Object.keys(requestBody));
    
    const { agentKey, phone, message, mediaUrl, skipSplit, buttons, footer, title } = requestBody as {
      agentKey: string; phone: string; message: string; mediaUrl?: string; skipSplit?: boolean;
      buttons?: Array<{ id: string; label: string }>; footer?: string; title?: string;
    };

    // 🔍 DEBUG: Log explícito do parâmetro skipSplit
    console.log('[ZAPI-SEND] 🔍 DEBUG - Request body:', { 
      skipSplit, 
      skipSplitType: typeof skipSplit,
      hasSkipSplit: 'skipSplit' in requestBody,
      bodyKeys: Object.keys(requestBody)
    });

    if (!agentKey || !phone || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 🔄 EVOLUTION SHIM: notifications (agentKey='exa_alert') route via connected Evolution instance.
    // Keeps the entire pipeline (dedup, split, logs, messages persist) — only swaps the transport.
    const useEvolution = agentKey === 'exa_alert';
    let evolutionInstanceName: string | null = null;
    let evolutionApiUrl: string | null = null;
    let evolutionApiKey: string | null = null;
    let zapiConfig: any = null;
    let zapiClientToken: string | null = null;

    if (useEvolution) {
      const { data: evoInst, error: evoErr } = await supabase
        .from('evolution_instances')
        .select('instance_name, status')
        .eq('is_notifications', true)
        .maybeSingle();

      if (evoErr || !evoInst) {
        console.error('[ZAPI-SEND] ❌ No Evolution notifications instance found', evoErr);
        return new Response(JSON.stringify({ error: 'Evolution notifications instance not configured' }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (evoInst.status !== 'connected') {
        console.error('[ZAPI-SEND] ❌ Evolution notifications instance status:', evoInst.status);
        return new Response(JSON.stringify({ error: `Evolution instance not connected: ${evoInst.status}` }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      evolutionInstanceName = evoInst.instance_name;
      evolutionApiUrl = (Deno.env.get('EVOLUTION_API_URL') || '').replace(/\/+$/, '');
      evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY') || '';

      if (!evolutionApiUrl || !evolutionApiKey) {
        console.error('[ZAPI-SEND] ❌ EVOLUTION_API_URL/EVOLUTION_API_KEY missing');
        return new Response(JSON.stringify({ error: 'Evolution API not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('[ZAPI-SEND] 🔄 Routing via Evolution instance:', evolutionInstanceName);
    } else {
      // Buscar configuração do agente (Z-API legado)
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

      zapiConfig = agent.zapi_config;
      if (!zapiConfig?.instance_id || !zapiConfig?.token) {
        console.error('[ZAPI-SEND] Invalid Z-API config for agent:', agentKey);
        return new Response(JSON.stringify({ error: 'Invalid Z-API configuration' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      zapiClientToken = Deno.env.get('ZAPI_CLIENT_TOKEN') || null;
      if (!zapiClientToken) {
        console.error('[ZAPI-SEND] ❌ ZAPI_CLIENT_TOKEN not configured');
        return new Response(JSON.stringify({ error: 'Z-API Client Token not configured in secrets' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
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
      if (timeDiff < 8000) { // 8 segundos de proteção contra duplicação
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
        if (timeDiff < 8000) { // 8 segundos de proteção contra duplicação
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

    // 🤖 QUEBRAR MENSAGENS LONGAS (humanizar comunicação) - FARC FIX 2024-12
    const splitMessage = (text: string, maxLength = 1000): string[] => {
      if (text.length <= maxLength) return [text];
      
      // 🛡️ PROTEÇÃO 1: URLs completas (https://, http://, www.)
      const URL_PLACEHOLDER = '⟦URL⟧';
      const urls: string[] = [];
      let protectedText = text.replace(
        /(https?:\/\/[^\s]+|www\.[^\s]+)/gi, 
        (match) => {
          urls.push(match);
          return `${URL_PLACEHOLDER}${urls.length - 1}${URL_PLACEHOLDER}`;
        }
      );
      
      // 🛡️ PROTEÇÃO 2: Listas numeradas (1. 2. 3. etc)
      const LIST_PLACEHOLDER = '⟦LIST⟧';
      protectedText = protectedText.replace(/(\d+)\.\s/g, `$1${LIST_PLACEHOLDER} `);
      
      // 🛡️ PROTEÇÃO 3: Valores monetários (R$ 4.862,40)
      const MONEY_PLACEHOLDER = '⟦MONEY⟧';
      protectedText = protectedText.replace(/(\d)\.(\d{3})/g, `$1${MONEY_PLACEHOLDER}$2`);
      
      // Função para restaurar todos os placeholders
      const restorePlaceholders = (chunk: string): string => {
        let restored = chunk;
        // Restaurar URLs
        restored = restored.replace(/⟦URL⟧(\d+)⟦URL⟧/g, (_, idx) => urls[parseInt(idx)] || '');
        // Restaurar listas numeradas
        restored = restored.replace(new RegExp(LIST_PLACEHOLDER, 'g'), '.');
        // Restaurar valores monetários
        restored = restored.replace(new RegExp(MONEY_PLACEHOLDER, 'g'), '.');
        return restored;
      };
      
      // 🔄 DIVIDIR POR PARÁGRAFOS PRIMEIRO (preserva estrutura)
      const paragraphs = protectedText.split(/\n\n+/);
      const chunks: string[] = [];
      let currentChunk = '';
      
      for (const paragraph of paragraphs) {
        const testChunk = currentChunk ? currentChunk + '\n\n' + paragraph : paragraph;
        
        if (restorePlaceholders(testChunk).length <= maxLength) {
          currentChunk = testChunk;
        } else {
          // Parágrafo não cabe, salvar chunk atual e começar novo
          if (currentChunk) {
            chunks.push(restorePlaceholders(currentChunk.trim()));
          }
          
          // Se parágrafo individual é muito grande, dividir por linhas
          if (restorePlaceholders(paragraph).length > maxLength) {
            const lines = paragraph.split(/\n/);
            let lineChunk = '';
            
            for (const line of lines) {
              const testLine = lineChunk ? lineChunk + '\n' + line : line;
              if (restorePlaceholders(testLine).length <= maxLength) {
                lineChunk = testLine;
              } else {
                if (lineChunk) chunks.push(restorePlaceholders(lineChunk.trim()));
                lineChunk = line;
              }
            }
            currentChunk = lineChunk;
          } else {
            currentChunk = paragraph;
          }
        }
      }
      
      if (currentChunk) {
        chunks.push(restorePlaceholders(currentChunk.trim()));
      }
      
      // Filtrar chunks vazios
      return chunks.filter(c => c.trim().length > 0);
    };




    // 🛡️ ENVIAR COM RETRY (blindagem contra desconexão) — suporta Z-API e Evolution
    const sendWithRetry = async (url: string, body: any, headers: Record<string, string>, retries = 3): Promise<any> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(body),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          const text = await response.text();
          let result: any = text;
          try { result = text ? JSON.parse(text) : {}; } catch { /* keep text */ }

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${typeof result === 'string' ? result : JSON.stringify(result)}`);
          }
          return result;
        } catch (error) {
          console.error(`[ZAPI-SEND] ⚠️ Attempt ${attempt}/${retries} failed:`, (error as Error).message);
          if (attempt === retries) {
            throw new Error(`Failed after ${retries} attempts: ${(error as Error).message}`);
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    };

    // ============= BUTTONS -> TEXTO NUMERADO =============
    // Evolution/Baileys sendButtons retorna 200 OK mas o WhatsApp moderno (multi-device)
    // não decodifica o buttonsMessage legado e fica em "Aguardando mensagem".
    // Por isso convertemos buttons em lista numerada de texto por padrão.
    // Para re-testar botões nativos, passar forceNativeButtons:true no body.
    const forceNativeButtons = (requestBody as any).forceNativeButtons === true;
    const hasButtons = Array.isArray(buttons) && buttons.length > 0;
    let buttonSendMode: 'buttons' | 'text_numbered' | null = null;
    let buttonError: string | null = null;

    if (hasButtons && useEvolution && forceNativeButtons) {
      const cleanPhone = normalizePhoneBR(phone);
      const trimmedButtons = buttons!.slice(0, 3);
      const btnUrl = `${evolutionApiUrl}/message/sendButtons/${evolutionInstanceName}`;
      const btnPayload = {
        number: cleanPhone,
        title: title || undefined,
        description: message,
        footer: footer || undefined,
        buttons: trimmedButtons.map((b) => ({ type: 'reply', displayText: b.label, id: b.id })),
      };
      try {
        const buttonResult = await sendWithRetry(btnUrl, btnPayload, { apikey: evolutionApiKey! }, 1);
        const messageId = buttonResult?.key?.id ?? buttonResult?.messageId ?? null;
        await supabase.from('evolution_logs').insert({
          agent_key: agentKey, direction: 'outbound', phone_number: phone,
          message_text: message, status: 'sent',
          zapi_message_id: messageId,
          metadata: { response: buttonResult, provider: 'evolution', send_mode: 'buttons', buttons: trimmedButtons },
        });
        return new Response(JSON.stringify({ success: true, messageId, sendMode: 'buttons' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        buttonError = (err as Error).message;
        console.warn('[ZAPI-SEND] ⚠️ forceNativeButtons failed, falling back to text:', buttonError);
      }
    }

    let effectiveMessage = message;
    if (hasButtons) {
      const trimmedButtons = buttons!.slice(0, 3);
      const numbered = trimmedButtons.map((b, i) => `${i + 1}. ${b.label}`).join('\n');
      effectiveMessage = `${message}\n\n*Responda com o número da opção:*\n${numbered}${footer ? `\n\n_${footer}_` : ''}`;
      buttonSendMode = 'text_numbered';
    }

    // Se skipSplit = true OU temos buttons numerados, não quebrar
    const messageChunks = (skipSplit || hasButtons) ? [effectiveMessage] : splitMessage(effectiveMessage);
    console.log('[ZAPI-SEND] 📤 Sending', messageChunks.length, 'chunks via', useEvolution ? 'EVOLUTION' : 'Z-API', skipSplit ? '(skipSplit)' : '', buttonSendMode === 'text_numbered' ? '(text_numbered)' : '');


    // Build transport-specific URL + headers + payload
    const sendUrl = useEvolution
      ? `${evolutionApiUrl}/message/sendText/${evolutionInstanceName}`
      : `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.token}/send-text`;
    const sendHeaders: Record<string, string> = useEvolution
      ? { apikey: evolutionApiKey! }
      : { 'Client-Token': zapiClientToken! };

    const results = [];
    for (let i = 0; i < messageChunks.length; i++) {
      const chunk = messageChunks[i];
      const cleanPhone = normalizePhoneBR(phone);
      const payload = useEvolution
        ? { number: cleanPhone, text: chunk }
        : { phone: cleanPhone, message: chunk };

      console.log('[ZAPI-SEND] 📤 Chunk', i + 1, '/', messageChunks.length, ':', {
        provider: useEvolution ? 'evolution' : 'zapi',
        agent: agentKey, phone_in: phone, phone_normalized: cleanPhone,
        preview: chunk.substring(0, 50) + '...', length: chunk.length,
      });

      try {
        const chunkResult = await sendWithRetry(sendUrl, payload, sendHeaders);
        results.push(chunkResult);
        console.log('[ZAPI-SEND] ✅ Chunk', i + 1, 'sent');
        if (i < messageChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      } catch (error) {
        console.error('[ZAPI-SEND] ❌ Failed chunk', i + 1, ':', (error as Error).message);
        await supabase.from('evolution_logs').insert({
          agent_key: agentKey, direction: 'outbound', phone_number: phone,
          message_text: chunk, status: 'failed', error_message: (error as Error).message,
          metadata: { error: (error as Error).message, chunkIndex: i, totalChunks: messageChunks.length, provider: useEvolution ? 'evolution' : 'zapi' }
        });
        throw error;
      }
    }

    const zapiResult = results[results.length - 1];
    // Normalize messageId across providers
    const messageId = useEvolution
      ? (zapiResult?.key?.id ?? zapiResult?.messageId ?? null)
      : (zapiResult?.messageId ?? null);

    console.log('[ZAPI-SEND] ✅ All chunks sent:', { totalChunks: messageChunks.length, messageId, phone, agent: agentKey });

    // Log sucesso
    await supabase.from('evolution_logs').insert({
      agent_key: agentKey, direction: 'outbound', phone_number: phone,
      message_text: message, media_url: mediaUrl || null, status: 'sent',
      zapi_message_id: messageId,
      metadata: { response: zapiResult, totalChunks: messageChunks.length, allResults: results, provider: useEvolution ? 'evolution' : 'zapi', send_mode: buttonSendMode ?? 'text', button_error: buttonError ?? undefined }
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
      // ✅ Marcar conversa como NÃO aguardando resposta (outbound)
      console.log('[ZAPI-SEND] 📤 Marking conversation as not awaiting response (outbound)');
      
      await supabase
        .from('conversations')
        .update({ 
          awaiting_response: false,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversation.id);
      
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        agent_key: agentKey,
        provider: useEvolution ? 'evolution' : 'zapi',
        direction: 'outbound',
        from_role: 'agent',
        body: message,
        is_automated: true,
        raw_payload: { 
          zapi_message_id: messageId,
          sent_at: new Date().toISOString(),
          media_url: mediaUrl || null,
          sentInChunks: messageChunks.length > 1,
          totalChunks: messageChunks.length,
          provider: useEvolution ? 'evolution' : 'zapi'
        }
      });
      
      console.log('[ZAPI-SEND] ✅ Outbound message saved (chunks:', messageChunks.length, ')');
    } else {
      console.warn('[ZAPI-SEND] ⚠️ No conversation found for phone:', phone);
    }

    // Log no agent_logs
    await supabase.from('agent_logs').insert({
      agent_key: agentKey,
      event_type: 'message_sent',
      metadata: {
        phone,
        messageId,
        provider: useEvolution ? 'evolution' : 'zapi'
      }
    });

    return new Response(JSON.stringify({ 
      success: true,
      messageId,
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
