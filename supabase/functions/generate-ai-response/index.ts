import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getFromCache, saveToCache } from '../_shared/cache.ts';

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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { agentKey, conversationId, message, phoneNumber } = await req.json();

    console.log('[AI-RESPONSE] 🤖 Starting AI response generation:', {
      agentKey,
      conversationId,
      phoneNumber,
      messagePreview: message.substring(0, 50),
      timestamp: new Date().toISOString()
    });

    // ====== LOCK ATÔMICO OTIMIZADO (45s + auto-cleanup) ======
    const lockKey = `lock_${conversationId}_${message.substring(0, 30)}`;
    const LOCK_TIMEOUT_MS = 45000; // 45 segundos

    const { data: existingLock } = await supabase
      .from('agent_context')
      .select('created_at')
      .eq('key', lockKey)
      .maybeSingle();

    if (existingLock) {
      const age = Date.now() - new Date(existingLock.created_at).getTime();
      if (age < LOCK_TIMEOUT_MS) {
        console.log('[AI-RESPONSE] 🔒 LOCKED - Processando...', { ageMs: age });
        return new Response(JSON.stringify({ success: false, reason: 'locked' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      // Lock expirado, limpar
      await supabase.from('agent_context').delete().eq('key', lockKey);
    }

    await supabase.from('agent_context').insert({ key: lockKey, value: {} });

    const releaseLock = async () => {
      await supabase.from('agent_context').delete().eq('key', lockKey);
    };

    // Auto-cleanup após 60s (fallback)
    setTimeout(() => releaseLock(), 60000);

    // ====== LOG INÍCIO EM AGENT_LOGS ======
    await supabase.from('agent_logs').insert({
      agent_key: agentKey,
      conversation_id: conversationId,
      event_type: 'ai_request_initiated',
      metadata: {
        userMessage: message,
        timestamp: new Date().toISOString()
      }
    });

    // ====== DETECTAR TIPO DE REQUISIÇÃO ======
    const startTime = Date.now();
    const isFullListRequest = message.match(/todos|lista completa|quantos prédios|quais prédios|mostre.*prédios|ver.*prédios/i);
    const isComplexSearch = message.match(/preço|valor|quanto custa|endereço|onde fica|visualizações/i);
    
    // ====== BUSCAR DADOS EM PARALELO (OTIMIZADO) ======
    const [
      { data: agent },
      { data: agentKnowledge },
      { data: conversationHistory },
      { data: conversation }
    ] = await Promise.all([
      supabase.from('agents').select('*').eq('key', agentKey).single(),
      supabase.from('agent_knowledge').select('*').eq('agent_key', agentKey).eq('is_active', true).order('created_at', { ascending: false }).limit(5),
      supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(10),
      supabase.from('conversations').select('provider').eq('id', conversationId).single()
    ]);

    // ====== BUSCAR PRÉDIOS (LAZY LOAD + CACHE) ======
    let buildingsData;
    const cacheKey = `buildings_cache_${agentKey}`;
    
    if (isFullListRequest || isComplexSearch) {
      // Tentar buscar do cache primeiro (5 minutos)
      buildingsData = await getFromCache(supabase, cacheKey, 300);
      
      if (!buildingsData) {
        console.log('[AI-RESPONSE] 🔍 Cache miss, fetching all buildings...');
        const { data } = await supabase
          .from('buildings')
          .select('nome, preco_base, visualizacoes_mes, bairro, endereco, cidade, estado, status')
          .in('status', ['ativo', 'instalação'])
          .order('nome');
        
        buildingsData = data;
        
        // Salvar no cache
        if (buildingsData) {
          await saveToCache(supabase, cacheKey, buildingsData);
        }
      } else {
        console.log('[AI-RESPONSE] ✅ Cache hit for buildings');
      }
    } else {
      // Busca simplificada: apenas 5 principais
      console.log('[AI-RESPONSE] 📊 Simple query: fetching top 5 buildings');
      const { data } = await supabase
        .from('buildings')
        .select('nome, preco_base, bairro')
        .in('status', ['ativo', 'instalação'])
        .order('nome')
        .limit(5);
      
      buildingsData = data;
    }

    if (!agent) {
      throw new Error('Agent not found');
    }

    if (!agent.ai_auto_response) {
      console.log('[AI-RESPONSE] ⏸️ AI auto-response disabled');
      return new Response(
        JSON.stringify({ success: false, message: 'AI auto-response disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ====== FUZZY MATCHING COM LEVENSHTEIN ======
    const normalizeName = (text: string) => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const levenshteinDistance = (str1: string, str2: string): number => {
      const track = Array(str2.length + 1).fill(null).map(() =>
        Array(str1.length + 1).fill(null));
      for (let i = 0; i <= str1.length; i += 1) {
        track[0][i] = i;
      }
      for (let j = 0; j <= str2.length; j += 1) {
        track[j][0] = j;
      }
      for (let j = 1; j <= str2.length; j += 1) {
        for (let i = 1; i <= str1.length; i += 1) {
          const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
          track[j][i] = Math.min(
            track[j][i - 1] + 1,
            track[j - 1][i] + 1,
            track[j - 1][i - 1] + indicator,
          );
        }
      }
      return track[str2.length][str1.length];
    };

    const stringSimilarity = (str1: string, str2: string): number => {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;
      const distance = levenshteinDistance(longer, shorter);
      return (longer.length - distance) / longer.length;
    };

    const userNormalized = normalizeName(message);
    
    const allMatches = buildingsData?.map((b: any) => {
      const bNormalized = normalizeName(b.nome);
      
      if (userNormalized.includes(bNormalized)) {
        return { building: b, score: 1.0, method: 'exact' };
      }
      
      const predioMatch = userNormalized.match(/predio\s+([a-z0-9\s]{2,40})/);
      if (predioMatch) {
        const mentionedName = predioMatch[1].trim();
        const similarity = stringSimilarity(mentionedName, bNormalized);
        
        if (similarity >= 0.6) {
          return { building: b, score: similarity, method: 'levenshtein' };
        }
      }
      
      const userWords = userNormalized.split(' ');
      const buildingWords = bNormalized.split(' ');
      const matchCount = buildingWords.filter(word => 
        userWords.some(uWord => uWord.includes(word) || word.includes(uWord))
      ).length;
      const wordScore = matchCount / buildingWords.length;
      
      if (wordScore >= 0.7) {
        return { building: b, score: wordScore, method: 'word_match' };
      }
      
      return null;
    }).filter(m => m !== null).sort((a, b) => b!.score - a!.score) || [];

    const buildingMentioned = allMatches[0]?.building;
    const matchDetails = allMatches[0];

    const top3Matches = allMatches.slice(0, 3).map(m => ({
      nome: m!.building.nome,
      score: `${(m!.score * 100).toFixed(1)}%`,
      method: m!.method
    }));

    console.log('[AI-RESPONSE] 🔍 FUZZY MATCH RESULT:', {
      buildingDetected: buildingMentioned?.nome || 'NONE',
      matchScore: matchDetails ? `${(matchDetails.score * 100).toFixed(1)}%` : 'n/a',
      matchMethod: matchDetails?.method || 'n/a',
      top3Matches,
      totalBuildingsAvailable: buildingsData?.length || 0
    });

    // isFullListRequest já foi detectado acima
    
    // ====== CONSTRUIR DADOS DOS PRÉDIOS (COM DETALHES COMPLETOS) ======
    const buildingsFormatted = buildingsData && buildingsData.length > 0 
      ? buildingsData.map((b: any) => {
          const statusEmoji = b.status === 'ativo' ? '✅' : '🚧';
          const visualizacoes = b.visualizacoes_mes || (b.quantidade_telas ? b.quantidade_telas * 7350 : 0);
          return `${statusEmoji} **${b.nome}**
   📍 ${b.bairro} - ${b.cidade}/${b.estado}
   📊 ${visualizacoes.toLocaleString('pt-BR')} exibições/mês
   💰 R$ ${b.preco_base?.toFixed(2) || '?'}/mês
   🏢 ${b.endereco}`;
        }).join('\n\n')
      : 'Nenhum prédio disponível';

    // ====== CONSTRUIR KNOWLEDGE BASE ======
    const knowledgeContext = agentKnowledge && agentKnowledge.length > 0
      ? agentKnowledge.map((k: any) => `### ${k.title}\n${k.content}`).join('\n\n')
      : '';

    // ====== CONSTRUIR HISTÓRICO ======
    const historyFormatted = conversationHistory && conversationHistory.length > 0
      ? conversationHistory.map((m: any) => 
          `${m.direction === 'inbound' ? 'Cliente' : 'Sofia'}: ${m.body}`
        ).join('\n')
      : '';

    // ====== CONSTRUIR SYSTEM PROMPT OTIMIZADO ======
    const systemPrompt = `Você é Sofia da Exa Mídia - vendedora de painéis digitais.

${conversationHistory && conversationHistory.length > 0 ? `
## 📜 HISTÓRICO (LER ANTES DE RESPONDER!)

${historyFormatted}

🚨 REGRAS DO HISTÓRICO:
- Se já se apresentou, NUNCA mais diga "Oi" ou "Olá"
- Se cliente já disse o negócio, NUNCA pergunte de novo
- Se cliente enviou imagem, comente naturalmente (ex: "Que delícia! 🍖")
- SEMPRE avance na conversa, não repita perguntas

` : `
✅ PRIMEIRA MENSAGEM: "Oi! Sou a Sofia da Exa 😊 O que você quer anunciar?"
`}

## ⚠️ REGRAS OBRIGATÓRIAS - NUNCA VIOLE!

### 📋 LISTA COMPLETA DE PRÉDIOS:
${isFullListRequest ? `
🚨 ATENÇÃO: Cliente pediu LISTA COMPLETA!

**INSTRUÇÕES ESPECIAIS:**
1. Mostre TODOS os ${buildingsData?.length || 0} prédios disponíveis
2. Use o formato EXATO que está em "PRÉDIOS DISPONÍVEIS"
3. Inicie com: "Temos ${buildingsData?.length || 0} prédios disponíveis! 🏢"
4. Termine com: "Gostou de algum? Posso te passar mais detalhes! 😊"
5. NÃO resuma, NÃO corte, mostre TUDO
` : `
- Ao mencionar prédios, mostre máx 3 de cada vez
- Se perguntarem sobre prédio específico, dê TODOS os detalhes (endereço, exibições, preço)
- Se pedirem "todos", avise: "Vou te mostrar a lista completa!"
`}

### 💬 ESTILO DE MENSAGEM:
- Mensagens CURTAS (máx 2-3 linhas) - EXCETO quando for lista completa
- Natural e conversacional
- Use emoji com moderação
- Se cliente enviar imagem: comente rápido e volte ao funil

## 🎯 FUNIL DE VENDAS (seguir ordem)

1. Qualificar negócio: "O que você quer anunciar?"
2. Qualificar quantidade: "Quantos prédios?"
3. Upsell descontos: "Com 2 prédios: 15% OFF | 5: 30% OFF | 10+: 40% OFF"
4. Direcionar site: "www.examidia.com.br"

## 🏢 PRÉDIOS DISPONÍVEIS (${buildingsData?.length || 0} opções)

${buildingsFormatted}

## 📚 CONHECIMENTO

${knowledgeContext}

---

Responda de forma natural e objetiva. Se pedirem lista completa, mostre TODOS os prédios do formato acima.`;

    console.log('[AI-RESPONSE] 📝 Prompt constructed:', {
      promptLength: systemPrompt.length,
      buildingsCount: buildingsData?.length || 0,
      knowledgeSections: agentKnowledge?.length || 0
    });

    // ====== LOG PRÉ-VALIDAÇÃO EM AGENT_LOGS (COM PERFORMANCE) ======
    const contextPrepTime = Date.now() - startTime;
    
    await supabase.from('agent_logs').insert({
      agent_key: agentKey,
      conversation_id: conversationId,
      event_type: 'ai_context_prepared',
      metadata: {
        buildingDetected: buildingMentioned?.nome || 'NONE',
        fuzzyMatchScore: matchDetails ? `${(matchDetails.score * 100).toFixed(1)}%` : 'N/A',
        fuzzyMatchMethod: matchDetails?.method || 'N/A',
        top3Matches,
        buildingsCount: buildingsData?.length || 0,
        promptTokens: Math.floor(systemPrompt.length / 4),
        contextPrepTimeMs: contextPrepTime,
        isFullListRequest: !!isFullListRequest,
        isComplexSearch: !!isComplexSearch,
        timestamp: new Date().toISOString()
      }
    });

    // ====== ENVIAR MENSAGEM HUMANIZADA DE AGUARDE ======
    if (isFullListRequest || isComplexSearch) {
      console.log('[AI-RESPONSE] 💬 Sending "wait" message...');
      
      const waitMessages = isFullListRequest 
        ? [
            "Só um momento, vou buscar todos os prédios disponíveis! 🔍",
            "Deixa eu organizar a lista completa pra você! ⏱️",
            "Preparando lista completa... já volto! 💭"
          ]
        : [
            "Deixa eu procurar isso no sistema... 🔍",
            "Um momento, já te respondo! ⏱️",
            "Só um instantinho, estou verificando... 💭"
          ];
      
      const waitMsg = waitMessages[Math.floor(Math.random() * waitMessages.length)];
      
      if (conversation?.provider === 'manychat') {
        await supabase.functions.invoke('send-message-unified', {
          body: {
            conversationId,
            agentKey,
            message: waitMsg
          }
        });
      } else {
        await supabase.functions.invoke('zapi-send-message', {
          body: {
            agentKey,
            phone: phoneNumber,
            message: waitMsg
          }
        });
      }
      
      // Aguardar 2 segundos
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // ====== CHAMAR OPENAI ======
    console.log('[AI-RESPONSE] 🤖 Calling OpenAI...');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const maxTokens = isFullListRequest ? 3000 : 500;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const aiReply = openaiData.choices[0]?.message?.content || '';

    if (!aiReply || aiReply.trim().length < 3) {
      console.error('[AI-RESPONSE] ❌ Resposta vazia ou muito curta');
      await releaseLock();
      throw new Error('AI response invalid');
    }

    // Sanitizar resposta (preservar quebras de linha para formatação WhatsApp)
    const sanitizedReply = aiReply
      .replace(/\n{3,}/g, '\n\n')  // Limitar quebras múltiplas a 2
      .trim();

    // Validar se IA mencionou agendamento por engano
    if (sanitizedReply.match(/agendar|agenda|horário|visita|reunião/i)) {
      console.log('[AI-RESPONSE] ⚠️ Possible scheduling mention detected');
      
      await supabase.from('agent_logs').insert({
        agent_key: agentKey,
        conversation_id: conversationId,
        event_type: 'scheduling_mention_warning',
        metadata: {
          message: sanitizedReply,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validar se IA enviou site sem qualificar lead
    const conversationMessages = conversationHistory || [];
    const sofiaAskedAboutBusiness = conversationMessages.some((m: any) => 
      m.direction === 'outbound' && m.body.match(/qual.*negócio|qual.*empresa|o que você faz/i)
    );
    
    const userAskedAboutSite = message.match(/comprar|contratar|site|onde|como faço/i);
    
    if (sanitizedReply.includes('examidia.com.br') && !userAskedAboutSite && !sofiaAskedAboutBusiness) {
      console.log('[AI-RESPONSE] ⚠️ Site mentioned without lead qualification');
      
      await supabase.from('agent_logs').insert({
        agent_key: agentKey,
        conversation_id: conversationId,
        event_type: 'unsolicited_site_mention',
        metadata: {
          message: sanitizedReply,
          sofiaAskedBusiness: sofiaAskedAboutBusiness,
          userAskedSite: !!userAskedAboutSite,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Validar tamanho da mensagem (EXCETO para lista completa)
    if (!isFullListRequest) {
      const lineCount = sanitizedReply.split('\n').length;
      const hasUrl = sanitizedReply.includes('http') || sanitizedReply.includes('www.');
      const maxLines = hasUrl ? 3 : 4;
      
      if (lineCount > maxLines) {
        console.log('[AI-RESPONSE] ⚠️ Message too long:', {
          lines: lineCount,
          maxAllowed: maxLines,
          hasUrl
        });
        
        await supabase.from('agent_logs').insert({
          agent_key: agentKey,
          conversation_id: conversationId,
          event_type: 'long_message_warning',
          metadata: {
            lineCount,
            maxAllowed: maxLines,
            hasUrl,
            messagePreview: sanitizedReply.substring(0, 200),
            timestamp: new Date().toISOString()
          }
        });
      }

      // Validar tamanho total da mensagem
      if (sanitizedReply.length > 1000) {
        console.log('[AI-RESPONSE] ⚠️ Long message detected:', {
          length: sanitizedReply.length,
          preview: sanitizedReply.substring(0, 100)
        });
        
        await supabase.from('agent_logs').insert({
          agent_key: agentKey,
          conversation_id: conversationId,
          event_type: 'long_message_warning',
          metadata: {
            length: sanitizedReply.length,
            messagePreview: sanitizedReply.substring(0, 200),
            timestamp: new Date().toISOString()
          }
        });
      }
    } else {
      console.log('[AI-RESPONSE] ✅ Full list response - size validation SKIPPED');
    }

    // Detectar report de problema técnico em painel
    if (sanitizedReply.match(/alertar.*técnico|problema.*painel|tá com problema/i)) {
      console.log('[AI-RESPONSE] 🚨 Panel technical issue reported');
      
      await supabase.from('agent_logs').insert({
        agent_key: agentKey,
        conversation_id: conversationId,
        event_type: 'panel_technical_issue',
        metadata: {
          phone: phoneNumber,
          userMessage: message,
          aiResponse: sanitizedReply,
          timestamp: new Date().toISOString(),
          priority: 'high'
        }
      });
    }

    console.log('[AI-RESPONSE] ✅ AI reply generated:', sanitizedReply.substring(0, 80) + '...');

    // ====== LOG RESPOSTA EM AGENT_LOGS (COM PERFORMANCE) ======
    const totalTime = Date.now() - startTime;
    
    await supabase.from('agent_logs').insert({
      agent_key: agentKey,
      conversation_id: conversationId,
      event_type: 'ai_response_generated',
      metadata: {
        responsePreview: sanitizedReply.substring(0, 100),
        responseLength: sanitizedReply.length,
        tokensUsed: openaiData.usage?.total_tokens,
        model: 'gpt-4o-mini',
        totalTimeMs: totalTime,
        contextPrepTimeMs: contextPrepTime,
        openaiTimeMs: totalTime - contextPrepTime,
        timestamp: new Date().toISOString()
      }
    });

    // ====== ENVIAR MENSAGEM ======
    console.log('[AI-RESPONSE] 📨 Sending message via', conversation?.provider);

    let sendResult, sendError;
    if (conversation?.provider === 'manychat') {
      const result = await supabase.functions.invoke('send-message-unified', {
        body: {
          conversationId,
          agentKey,
          message: sanitizedReply
        }
      });
      sendResult = result.data;
      sendError = result.error;
    } else {
      const result = await supabase.functions.invoke('zapi-send-message', {
        body: {
          agentKey,
          phone: phoneNumber,
          message: sanitizedReply
        }
      });
      sendResult = result.data;
      sendError = result.error;
    }

    if (sendError) {
      console.error('[AI-RESPONSE] ❌ Send error:', sendError);
      throw new Error('Failed to send message');
    }

    // ====== LOG SUCESSO FINAL EM AGENT_LOGS ======
    await supabase.from('agent_logs').insert({
      agent_key: agentKey,
      conversation_id: conversationId,
      event_type: 'ai_response_sent',
      metadata: {
        messagePreview: message.substring(0, 100),
        responsePreview: sanitizedReply.substring(0, 100),
        success: true,
        timestamp: new Date().toISOString()
      }
    });

    console.log('[AI-RESPONSE] 🎉 Complete! AI response flow finished successfully');

    await releaseLock();

    return new Response(
      JSON.stringify({ 
        success: true,
        response: sanitizedReply
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI-RESPONSE] 💥 FATAL ERROR:', error);
    
    // Liberar lock em caso de erro
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      const { conversationId, message } = await req.json().catch(() => ({}));
      if (conversationId && message) {
        const lockKey = `lock_${conversationId}_${message.substring(0, 30)}`;
        await supabase.from('agent_context').delete().eq('key', lockKey);
      }
    } catch (lockError) {
      console.error('[AI-RESPONSE] Failed to release lock:', lockError);
    }
    
    // ====== LOG ERRO EM AGENT_LOGS ======
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { agentKey, conversationId } = await req.json().catch(() => ({}));
      
      if (agentKey) {
        await supabase.from('agent_logs').insert({
          agent_key: agentKey,
          conversation_id: conversationId,
          event_type: 'ai_response_error',
          metadata: {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (logError) {
      console.error('[AI-RESPONSE] Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
