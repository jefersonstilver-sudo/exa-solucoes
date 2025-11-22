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

    const { agentKey, conversationId, message, phoneNumber, messageId } = await req.json();

    console.log('[AI-RESPONSE] 🤖 Starting AI response generation:', {
      agentKey,
      conversationId,
      phoneNumber,
      messageId,
      messagePreview: message.substring(0, 50),
      timestamp: new Date().toISOString()
    });

    // ====== PRÉ-VERIFICAÇÃO: CHECAR SE JÁ FOI PROCESSADO ======
    const { data: existingLog } = await supabase
      .from('zapi_logs')
      .select('id, created_at')
      .eq('zapi_message_id', messageId)
      .eq('direction', 'outbound')
      .maybeSingle();

    if (existingLog) {
      console.log('[AI-RESPONSE] ⚠️ Message already processed:', {
        messageId,
        existingLogId: existingLog.id,
        processedAt: existingLog.created_at
      });
      return new Response(JSON.stringify({ 
        success: false, 
        reason: 'already_processed',
        existingLogId: existingLog.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // ====== LOCK ATÔMICO (conversationId + messageId) ======
    const lockKey = `lock_${conversationId}_${messageId}`;
    const LOCK_TIMEOUT_MS = 90000; // 90 segundos (aumentado para queries complexas)

    console.log('[AI-RESPONSE] 🔐 Attempting to acquire lock:', {
      lockKey,
      conversationId,
      messagePreview: message.substring(0, 30)
    });

    // Tentar criar lock com INSERT (atomic)
    const { data: lockInserted, error: lockError } = await supabase
      .from('agent_context')
      .insert({ 
        key: lockKey, 
        value: { 
          acquired_at: new Date().toISOString(),
          conversation_id: conversationId,
          phone: phoneNumber
        } 
      })
      .select()
      .maybeSingle();

    // Se INSERT falhou, verificar se lock existe e está expirado
    if (lockError) {
      const { data: existingLock } = await supabase
        .from('agent_context')
        .select('created_at, value')
        .eq('key', lockKey)
        .maybeSingle();

      if (existingLock) {
        const age = Date.now() - new Date(existingLock.created_at).getTime();
        if (age < LOCK_TIMEOUT_MS) {
          console.log('[AI-RESPONSE] 🔒 LOCKED - Mensagem já sendo processada', { 
            ageMs: age,
            lockKey,
            existingSince: existingLock.created_at
          });
          return new Response(JSON.stringify({ 
            success: false, 
            reason: 'locked',
            message: 'Message already being processed',
            lockAge: age
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409
          });
        }
        // Lock expirado, deletar
        console.log('[AI-RESPONSE] ⏰ Lock expired, cleaning up...');
        await supabase.from('agent_context').delete().eq('key', lockKey);
        
        // Tentar novamente
        const { error: retryError } = await supabase
          .from('agent_context')
          .insert({ key: lockKey, value: {} });
        
        if (retryError) {
          console.error('[AI-RESPONSE] ❌ Failed to acquire lock on retry');
          return new Response(JSON.stringify({ success: false, reason: 'lock_failed' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409
          });
        }
      }
    }

    console.log('[AI-RESPONSE] ✅ Lock acquired successfully');

    const releaseLock = async () => {
      console.log('[AI-RESPONSE] 🔓 Releasing lock:', lockKey);
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
        const { data, error: buildingsError } = await supabase
          .from('buildings')
          .select('nome, preco_base, visualizacoes_mes, bairro, endereco, status, quantidade_telas')
          .in('status', ['ativo', 'instalação'])
          .order('nome');
        
        if (buildingsError) {
          console.error('[AI-RESPONSE] ❌ Error fetching buildings:', buildingsError);
        }
        buildingsData = data;
        
        // Salvar no cache
        if (buildingsData) {
          await saveToCache(supabase, cacheKey, buildingsData);
        }
      } else {
        console.log('[AI-RESPONSE] ✅ Cache hit for buildings');
      }
    } else {
      // Busca simplificada: também precisa buscar TODOS os campos para validação
      console.log('[AI-RESPONSE] 📊 Simple query: fetching top 5 buildings');
      const { data, error: buildingsError } = await supabase
        .from('buildings')
        .select('nome, preco_base, visualizacoes_mes, bairro, endereco, quantidade_telas')
        .in('status', ['ativo', 'instalação'])
        .order('nome')
        .limit(5);
      
      if (buildingsError) {
        console.error('[AI-RESPONSE] ❌ Error fetching buildings:', buildingsError);
      }
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
    
    // ====== DETECTAR SE USUÁRIO PEDIU ENDEREÇO/DETALHES EXPLICITAMENTE ======
    const detailsRequested = message.match(/endereço|onde fica|localização|rua|avenida|visualizações|exibições|quantas pessoas/i);
    
    // ====== CONSTRUIR DADOS DOS PRÉDIOS (FORMATO LIMPO - SEM BAIRRO POR PADRÃO) ======
    // ⚠️ CRÍTICO: NUNCA usar valores fallback! Se não tem no banco, não mostrar!
    const buildingsFormatted = buildingsData && buildingsData.length > 0 
      ? buildingsData.map((b: any) => {
          const nome = b.nome || 'Sem nome';
          const bairro = b.bairro || '';
          const endereco = b.endereco || '';
          
          // ⚠️ VALIDAÇÃO CRÍTICA: Se não tem preco_base válido, LOGAR WARNING
          if (!b.preco_base || b.preco_base <= 0) {
            console.error(`[AI-RESPONSE] 🚨 CRITICAL: Building "${nome}" has NO PRICE in database!`);
            return null; // Não incluir prédios sem preço
          }
          
          const precoBase = b.preco_base.toFixed(2);
          const visualizacoes = b.visualizacoes_mes && b.visualizacoes_mes > 0 
            ? b.visualizacoes_mes 
            : (b.quantidade_telas ? b.quantidade_telas * 7350 : 7350);
          
          // Formato básico: apenas nome e preço (SEM bairro)
          let formatted = `🏢 *${nome}* • R$ ${precoBase}/mês`;
          
          // Adicionar detalhes SOMENTE se usuário pediu
          if (detailsRequested && bairro) {
            formatted += `\n📍 ${bairro}${endereco ? ' - ' + endereco : ''}`;
            formatted += `\n👥 ${visualizacoes.toLocaleString('pt-BR')} visualizações/mês`;
          }
          
          return formatted;
        }).filter(b => b !== null).join('\n\n') // Remover prédios sem preço
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

    // ====== CONSTRUIR SYSTEM PROMPT SIMPLIFICADO ======
    const systemPrompt = `Você é Sofia da Exa Mídia - vendedora de painéis digitais.

╔══════════════════════════════════════════════════════════╗
║ 🚨 REGRA CRÍTICA: VALORES DE PREÇOS                     ║
╚══════════════════════════════════════════════════════════╝
⚠️ VOCÊ DEVE USAR **EXATAMENTE** OS PREÇOS FORNECIDOS ABAIXO
⚠️ **NUNCA** invente, estime ou altere valores de preços
⚠️ Se um prédio não está na lista, diga "Não tenho informações"
⚠️ Os preços abaixo vêm DIRETO DO BANCO DE DADOS

${conversationHistory && conversationHistory.length > 0 ? `
## HISTÓRICO
${historyFormatted}

⚠️ REGRAS: Não repita perguntas já feitas. Avance na conversa.
` : `
PRIMEIRA MENSAGEM: "Oi! Sou a Sofia da Exa 😊 O que você quer anunciar?"
`}

${isFullListRequest ? `
╔═══════════════════════════════════════════════════╗
║ ⚠️ LISTA COMPLETA - ENVIAR TUDO EM 1 MENSAGEM!  ║
╚═══════════════════════════════════════════════════╝

INSTRUÇÕES OBRIGATÓRIAS:
✅ Enviar TODOS os ${buildingsData?.length || 0} prédios em UMA SÓ mensagem
✅ Iniciar: "Temos ${buildingsData?.length || 0} prédios! 🏢"
✅ Terminar: "Qual te interessou? 😊"
✅ Usar formato EXATO abaixo (COPIAR E COLAR OS PREÇOS)
🚫 NÃO dividir em partes
🚫 NÃO resumir
🚫 NÃO alterar nenhum preço

FORMATO:
Temos ${buildingsData?.length || 0} prédios! 🏢

${buildingsFormatted}

Qual te interessou? 😊
` : `
## PRÉDIOS (${buildingsData?.length || 0} disponíveis)
${buildingsFormatted}

REGRAS:
- Mostrar máx 3 prédios por vez
- Se pedir "todos": usar formato de lista completa
- Se pedir detalhes/endereço: adicionar bairro e visualizações
- **COPIAR OS PREÇOS EXATAMENTE COMO APARECEM ACIMA**
- Ser breve (2-3 linhas)
`}

## FUNIL
1. Qualificar: "O que quer anunciar?"
2. Quantidade: "Quantos prédios?"
3. Desconto: "2 prédios: 15% | 5: 30% | 10+: 40%"
4. Site: "www.examidia.com.br"

${knowledgeContext ? `\n## CONHECIMENTO\n${knowledgeContext}` : ''}`;

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

    const maxTokens = isFullListRequest ? 4096 : (isComplexSearch ? 1024 : 512);

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
          { role: 'user', content: message },
          ...(isFullListRequest ? [{
            role: 'system',
            content: `⚠️ CRÍTICO: Cliente pediu LISTA COMPLETA! Enviar TODOS os ${buildingsData?.length || 0} prédios em UMA mensagem!`
          }] : [])
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[AI-RESPONSE] ❌ OpenAI error:', openaiResponse.status, errorText);
      throw new Error(`OpenAI error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const aiReply = openaiData.choices[0]?.message?.content || '';

    if (!aiReply || aiReply.trim().length < 3) {
      console.error('[AI-RESPONSE] ❌ Resposta vazia ou muito curta');
      await releaseLock();
      throw new Error('AI response invalid');
    }

    // Sanitizar resposta
    let sanitizedReply = aiReply
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // ====== VALIDAÇÃO DE RESPOSTA (FASE 4) ======
    if (isFullListRequest && buildingsData && buildingsData.length > 0) {
      const buildingCount = (sanitizedReply.match(/🏢/g) || []).length;
      const expectedCount = buildingsData.length;
      
      console.log('[AI-RESPONSE] 🔍 Validating full list response:', {
        expectedCount,
        actualCount: buildingCount,
        isComplete: buildingCount >= expectedCount
      });

      if (buildingCount < expectedCount * 0.8) { // Se faltarem mais de 20% dos prédios
        console.error('[AI-RESPONSE] ⚠️ INCOMPLETE LIST DETECTED! Retrying with simpler prompt...');
        
        // Retry com prompt ultra-simplificado
        const retryPrompt = `Você DEVE copiar e colar TODOS os ${expectedCount} prédios abaixo em UMA mensagem:

Temos ${expectedCount} prédios! 🏢

${buildingsFormatted}

Qual te interessou? 😊`;

        const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: retryPrompt }],
            temperature: 0.3,
            max_tokens: 4096,
          }),
        });

        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          sanitizedReply = retryData.choices[0]?.message?.content?.trim() || sanitizedReply;
          console.log('[AI-RESPONSE] ✅ Retry successful');
        }
      }
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
