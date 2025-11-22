import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    // ====== LOCK ATÔMICO PARA EVITAR PROCESSAMENTO SIMULTÂNEO ======
    const messageHash = `${conversationId}_${message.substring(0, 50)}`;
    const lockKey = `ai_lock_${messageHash}`;

    // Tentar adquirir lock (usando agent_context como store de locks)
    const { data: existingLock } = await supabase
      .from('agent_context')
      .select('value, created_at')
      .eq('key', lockKey)
      .maybeSingle();

    if (existingLock) {
      const lockAge = Date.now() - new Date(existingLock.created_at).getTime();
      
      // Se lock tem menos de 30 segundos, está processando
      if (lockAge < 30000) {
        console.log('[AI-RESPONSE] 🔒 LOCKED - Another instance processing this message:', {
          lockKey,
          lockAge: `${Math.round(lockAge / 1000)}s`,
          messagePreview: message.substring(0, 30)
        });
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            reason: 'processing_in_progress',
            lockAge: Math.round(lockAge / 1000)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Lock expirado (>30s), pode ser de crash anterior - deletar
      console.log('[AI-RESPONSE] 🧹 Cleaning expired lock (age:', Math.round(lockAge / 1000), 's)');
      await supabase.from('agent_context').delete().eq('key', lockKey);
    }

    // Criar lock
    await supabase.from('agent_context').insert({
      key: lockKey,
      value: { 
        conversationId, 
        phoneNumber, 
        messagePreview: message.substring(0, 50),
        locked_at: new Date().toISOString()
      }
    });

    console.log('[AI-RESPONSE] 🔓 Lock acquired, processing message...');

    // Garantir que lock será liberado ao final (sucesso ou erro)
    const releaseLock = async () => {
      await supabase.from('agent_context').delete().eq('key', lockKey);
      console.log('[AI-RESPONSE] 🔓 Lock released');
    };

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

    // ====== BUSCAR DADOS EM PARALELO ======
    const [
      { data: agent },
      { data: agentKnowledge },
      { data: conversationHistory },
      { data: conversation },
      { data: buildingsData }
    ] = await Promise.all([
      supabase.from('agents').select('*').eq('key', agentKey).single(),
      supabase.from('agent_knowledge').select('*').eq('agent_key', agentKey).eq('is_active', true),
      supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(10),
      supabase.from('conversations').select('provider').eq('id', conversationId).single(),
      supabase.from('buildings').select('nome, codigo_predio, preco_base, quantidade_telas, publico_estimado, bairro, status').in('status', ['ativo', 'instalação']).limit(50)
    ]);

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

    // ====== CONSTRUIR DADOS DOS PRÉDIOS ======
    const buildingsFormatted = buildingsData && buildingsData.length > 0 
      ? buildingsData.map((b: any) => {
          const statusEmoji = b.status === 'ativo' ? '✅' : '🚧';
          return `${statusEmoji} ${b.nome} - R$ ${b.preco_base?.toFixed(2) || '?'}/mês - ${b.status}`;
        }).join('\n')
      : 'Nenhum prédio disponível';

    // ====== CONSTRUIR KNOWLEDGE BASE ======
    const knowledgeContext = agentKnowledge && agentKnowledge.length > 0
      ? agentKnowledge.map((k: any) => `### ${k.title}\n${k.content}`).join('\n\n')
      : '';

    // ====== CONSTRUIR HISTÓRICO EM ORDEM CRONOLÓGICA ======
    const historyFormatted = conversationHistory && conversationHistory.length > 0
      ? conversationHistory.map((m: any, idx: number) => 
          `${idx + 1}. [${m.direction === 'inbound' ? 'CLIENTE' : 'SOFIA'}]: ${m.body}`
        ).join('\n')
      : 'Início da conversa.';

    console.log(`[AI-RESPONSE] 📜 Histórico montado (${conversationHistory?.length || 0} msgs):\n${historyFormatted.substring(0, 300)}...`);

    // ====== DETECÇÃO DE IDIOMA DINÂMICA ======
    const detectLanguage = (text: string): 'pt' | 'es' | 'en' => {
      const esPatterns = /\b(hola|buenos|dias|noches|gracias|por favor|ustedes|venden|tienen|quiero|puedo)\b/i;
      const enPatterns = /\b(hello|hi|good|morning|evening|thank|you|please|have|sell|want)\b/i;
      const ptPatterns = /\b(oi|olá|bom dia|boa tarde|obrigado|por favor|você|vocês|quero|posso|sou brasileiro)\b/i;
      
      // Priorizar PT se detectar padrões fortes
      if (ptPatterns.test(text)) return 'pt';
      if (esPatterns.test(text)) return 'es';
      if (enPatterns.test(text)) return 'en';
      return 'pt'; // Default PT
    };

    // Pegar ÚLTIMAS 3 mensagens do cliente para detectar idioma
    const lastUserMessages = conversationHistory
      ?.filter((m: any) => m.direction === 'inbound')
      ?.slice(-3) // Últimas 3
      ?.map((m: any) => m.body)
      ?.join(' ') || message;

    const detectedLanguage = detectLanguage(lastUserMessages + ' ' + message);

    console.log(`[AI-RESPONSE] 🌍 Idioma detectado: ${detectedLanguage.toUpperCase()} (baseado em: "${lastUserMessages.substring(0, 50)}...")`);

    const languageInstructions = {
      pt: { greeting: 'Oi! Sou a Sofia da Exa Mídia 😊', rule: 'Responda SEMPRE em PORTUGUÊS' },
      es: { greeting: '¡Hola! Soy Sofia de Exa Mídia 😊', rule: 'Responda SEMPRE en ESPAÑOL' },
      en: { greeting: 'Hi! I\'m Sofia from Exa Mídia 😊', rule: 'Always respond in ENGLISH' }
    };

    const currentLanguage = languageInstructions[detectedLanguage];

    console.log(`[AI-RESPONSE] 📋 DEBUG COMPLETO:`, {
      conversationId,
      phoneNumber,
      messagePreview: message.substring(0, 50),
      detectedLanguage,
      historyLength: conversationHistory?.length || 0,
      knowledgeLength: agentKnowledge?.length || 0,
      hasHistory: !!(conversationHistory && conversationHistory.length > 0)
    });

    // ====== CONSTRUIR SYSTEM PROMPT COMPLETO ======
    const systemPrompt = `Você é Sofia da Exa Mídia - vendedora especialista em painéis digitais.

## 🧠 LEIA O HISTÓRICO ANTES DE RESPONDER

${conversationHistory && conversationHistory.length > 0 ? `
📜 HISTÓRICO DA CONVERSA (em ordem cronológica):
${historyFormatted}

🚫 VOCÊ JÁ SE APRESENTOU! NUNCA MAIS:
- Diga "Oi!", "Olá!" ou qualquer saudação
- Pergunte coisas que já perguntou
- Ignore informações que cliente já deu

✅ VOCÊ DEVE:
- Ler TODO o histórico acima
- Identificar onde cliente está no processo
- Avançar para próxima etapa do funil
- Usar informações já compartilhadas

**EXEMPLO:**
Histórico mostra:
1. [CLIENTE]: Oi
2. [SOFIA]: Oi! Sou a Sofia 😊 O que você quer anunciar?
3. [CLIENTE]: Meu restaurante

Você DEVE responder:
"Show! 🍽️ Você tava pensando em quantos prédios?"

Você NÃO DEVE responder:
"Oi! Sou a Sofia" ❌ (já se apresentou!)
"Qual é o seu negócio?" ❌ (ele já disse: restaurante!)

` : `
✅ PRIMEIRA MENSAGEM:
Apresente-se: "${currentLanguage.greeting}"
Qualifique: "O que você quer anunciar?"
`}

## 🌍 IDIOMA: ${detectedLanguage.toUpperCase()}
${currentLanguage.rule} durante TODA a conversa.

## 🎯 FLUXO DE VENDAS (siga ordem)

1️⃣ QUALIFICAR NEGÓCIO:
"Qual é o seu negócio? 🤔"

2️⃣ QUALIFICAR QUANTIDADE:
"Você tava pensando em quantos prédios?"

3️⃣ APRESENTAR OPÇÕES:
Use dados reais dos prédios da lista abaixo.

4️⃣ FAZER UPSELL:
"Com 2 prédios: 15% OFF... Com 5: 30% OFF!"

5️⃣ DIRECIONAR PARA SITE:
"Entra aqui: www.examidia.com.br"

## 📱 FORMATAÇÃO WHATSAPP

**LISTAS:**
✅ Edifício Provence - R$ 254/mês
✅ Pietro Angelo - R$ 129/mês

(use quebras de linha, não numere com 1. 2. 3.)

**LINKS:**
Envie limpo, sem markdown:
https://drive.google.com/...

## 📊 TOP 4 PRÉDIOS

1. **Royal Legacy** 🏆
   - 36.750 exibições/mês (5 painéis)
   - R$ 275/mês

2. **Viena**
   - 14.700 exibições/mês (2 painéis)
   - R$ 129/mês

3. **Edifício Provence**
   - 14.700 exibições/mês (2 painéis)
   - R$ 254/mês

4. **Edifício Luiz XV**
   - 7.350 exibições/mês (1 painel)
   - R$ 129/mês

## 🏢 OUTROS PRÉDIOS

${buildingsFormatted}

## ❌ NUNCA RESPONDA

- "Vou verificar" (use dados acima!)
- "Para valores, me chama no (45)..." (responda aqui!)
- "Depende do número de prédios" (dê preço exato!)

## 📚 BASE DE CONHECIMENTO

${knowledgeContext}

---

Responda de forma natural, use dados reais, e SEMPRE avance no funil de vendas.`;


    console.log('[AI-RESPONSE] 📝 Prompt constructed:', {
      promptLength: systemPrompt.length,
      buildingsCount: buildingsData?.length || 0,
      knowledgeSections: agentKnowledge?.length || 0
    });

    // ====== LOG PRÉ-VALIDAÇÃO EM AGENT_LOGS ======
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
        timestamp: new Date().toISOString()
      }
    });

    // ====== CHAMAR OPENAI ======
    console.log('[AI-RESPONSE] 🤖 Calling OpenAI...');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

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
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[AI-RESPONSE] ❌ OpenAI error:', {
        status: openaiResponse.status,
        error: errorText
      });
      throw new Error(`OpenAI error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const aiReply = openaiData.choices[0]?.message?.content || '';

    // ====== VALIDAÇÃO DE RESPOSTA VAZIA ======
    if (!aiReply || aiReply.trim().length === 0) {
      console.error('[AI-RESPONSE] ❌ Empty AI response received');
      await releaseLock();
      throw new Error('AI returned empty response');
    }

    if (aiReply.length < 3) {
      console.error('[AI-RESPONSE] ❌ AI response too short:', aiReply);
      await releaseLock();
      throw new Error('AI response too short');
    }

    console.log('[AI-RESPONSE] 🤖 OpenAI response received:', {
      aiReplyLength: aiReply.length,
      aiReplyPreview: aiReply.substring(0, 100),
      tokensUsed: openaiData.usage?.total_tokens,
      model: openaiData.model
    });

    if (!aiReply) {
      throw new Error('Empty AI response');
    }

    // Sanitizar resposta (preservar quebras de linha para formatação WhatsApp)
    const sanitizedReply = aiReply
      .replace(/\n{3,}/g, '\n\n')  // Limitar quebras múltiplas a 2
      .trim();

    console.log(`[AI-RESPONSE] 🤖 Resposta gerada:`, {
      preview: sanitizedReply.substring(0, 100),
      length: sanitizedReply.length,
      startsWithGreeting: /^(oi|olá|hola|hi)/i.test(sanitizedReply),
      containsUrl: /https?:\/\//i.test(sanitizedReply)
    });

    // ====== VALIDAÇÃO PÓS-RESPOSTA: LINKS QUEBRADOS ======
    if (sanitizedReply.match(/https?:\/\/[^\s]+/) && sanitizedReply.match(/https?:\/\/.*\n.*\S/)) {
      console.log('[AI-RESPONSE] ⚠️ WARNING: Link quebrado detectado!');
      
      await supabase.from('agent_logs').insert({
        agent_key: agentKey,
        conversation_id: conversationId,
        event_type: 'broken_link_detected',
        metadata: {
          message: sanitizedReply,
          timestamp: new Date().toISOString()
        }
      });
    }

    // ====== VALIDAÇÃO PÓS-RESPOSTA: RESET (SAUDAÇÃO REPETIDA) ======
    const hasSaudacao = sanitizedReply.match(/^(oi|olá|hola|hi|sou|soy|i'm)/i);
    const alreadyGreeted = conversationHistory?.some((m: any) => 
      m.direction === 'outbound' && m.body.match(/^(oi|olá|hola|hi|sou|soy|i'm)/i)
    );

    if (hasSaudacao && conversationHistory && conversationHistory.length > 0 && alreadyGreeted) {
      console.log('[AI-RESPONSE] ⚠️ WARNING: Reset detectado (saudação repetida)!');
      
      await supabase.from('agent_logs').insert({
        agent_key: agentKey,
        conversation_id: conversationId,
        event_type: 'reset_detected',
        metadata: {
          message: sanitizedReply,
          historyLength: conversationHistory.length,
          timestamp: new Date().toISOString()
        }
      });
    }

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

    // Validar tamanho da mensagem (máx 4 linhas, ou 3 se tiver URL)
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

    // ====== LOG RESPOSTA EM AGENT_LOGS ======
    await supabase.from('agent_logs').insert({
      agent_key: agentKey,
      conversation_id: conversationId,
      event_type: 'ai_response_generated',
      metadata: {
        responsePreview: sanitizedReply.substring(0, 100),
        responseLength: sanitizedReply.length,
        tokensUsed: openaiData.usage?.total_tokens,
        model: 'gpt-4o-mini',
        timestamp: new Date().toISOString()
      }
    });

    // ====== ENVIAR MENSAGEM ======
    console.log('[AI-RESPONSE] 📨 Preparando envio via', conversation?.provider, {
      phone: phoneNumber,
      conversationId,
      messageLength: sanitizedReply.length
    });

    let sendResult, sendError;
    if (conversation?.provider === 'manychat') {
      console.log('[AI-RESPONSE] 📤 Enviando via ManyChat...');
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
      console.log('[AI-RESPONSE] 📤 Enviando via ZAPI...', {
        phone: phoneNumber,
        messagePreview: sanitizedReply.substring(0, 50)
      });
      const result = await supabase.functions.invoke('zapi-send-message', {
        body: {
          agentKey,
          phone: phoneNumber,
          message: sanitizedReply
        }
      });
      sendResult = result.data;
      sendError = result.error;
      console.log('[AI-RESPONSE] 📥 ZAPI response:', { sendResult, sendError });
    }

    if (sendError) {
      console.error('[AI-RESPONSE] ❌ Send error:', sendError);
      throw new Error('Failed to send message');
    }
    
    console.log('[AI-RESPONSE] ✅ Message sent successfully:', sendResult);

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

    // Liberar lock
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
        const messageHash = `${conversationId}_${message.substring(0, 50)}`;
        const lockKey = `ai_lock_${messageHash}`;
        await supabase.from('agent_context').delete().eq('key', lockKey);
        console.log('[AI-RESPONSE] 🔓 Lock released (error path)');
      }
    } catch (unlockError) {
      console.error('[AI-RESPONSE] Failed to release lock:', unlockError);
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
