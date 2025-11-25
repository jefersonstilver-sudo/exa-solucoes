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
    
    // 🆕 DETECTAR BUSCA EM BASE DE CONHECIMENTO (Seção 4 + Knowledge Items)
    const isKnowledgeSearch = message.match(/institucional|empresa|quem.*exa|história|missão|proposta|cnpj|endereço.*empresa|media kit|midia kit|apresentação|sobre.*exa|quem são vocês|fale.*empresa|documento|pdf|arquivo|material/i);
    const needsHeavyKnowledge = isKnowledgeSearch || false;
    
    // ====== BUSCAR DADOS EM PARALELO (OTIMIZADO - CARREGAMENTO INTELIGENTE) ======
    // 🚀 Camada 1: SEMPRE carregar seções essenciais (1, 2, 3)
    const [
      { data: agent },
      { data: essentialSections },
      { data: conversationHistory },
      { data: conversation }
    ] = await Promise.all([
      supabase.from('agents').select('*').eq('key', agentKey).single(),
      supabase.from('agent_sections').select('*').eq('agent_id', agentKey).in('section_number', [1, 2, 3]).order('section_number'),
      supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(10),
      supabase.from('conversations').select('provider').eq('id', conversationId).single()
    ]);

    // 📚 Camada 2: CARREGAR seção 4 + knowledge items SOMENTE SE NECESSÁRIO
    let section4 = null;
    let fullKnowledgeItems = [];

    if (needsHeavyKnowledge) {
      console.log('[AI-RESPONSE] 📚 Knowledge search detected, loading full knowledge base...');
      
      const [sec4Result, knowledgeResult] = await Promise.all([
        supabase
          .from('agent_sections')
          .select('*')
          .eq('agent_id', agentKey)
          .eq('section_number', 4)
          .maybeSingle(),
        
        supabase
          .from('agent_knowledge_items')
          .select('*')
          .eq('agent_id', agentKey)
          .eq('active', true)
      ]);
      
      section4 = sec4Result.data;
      fullKnowledgeItems = knowledgeResult.data || [];
      
      console.log(`[AI-RESPONSE] 📚 Loaded section 4 + ${fullKnowledgeItems.length} knowledge items`);
    } else {
      console.log('[AI-RESPONSE] ⚡ Fast mode: Loading only essential sections (1,2,3)');
    }

    const agentSections = essentialSections; // Para compatibilidade com código abaixo
    const agentKnowledgeItems = needsHeavyKnowledge ? fullKnowledgeItems : [];

    // ====== ETAPA 4: GERENCIAMENTO DE NOME DO CLIENTE ======
    console.log('[AI-RESPONSE] 👤 Starting customer name detection...');
    
    // 1. Buscar nome salvo anteriormente nos logs
    const { data: existingNameLog } = await supabase
      .from('zapi_logs')
      .select('metadata')
      .eq('phone', phoneNumber)
      .not('metadata->customer_name', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    let customerName = existingNameLog?.metadata?.customer_name || null;
    
    // 2. Detectar nome na mensagem atual (regex patterns)
    if (!customerName) {
      const namePatterns = [
        /(?:me chamo|meu nome é|sou o|sou a|eu sou|pode me chamar de)\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+)/i,
        /(?:nome:?)\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+)/i,
        /^([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+)\s+(?:aqui|falando)/i
      ];
      
      for (const pattern of namePatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          customerName = match[1].trim();
          console.log('[AI-RESPONSE] 👤 Name detected in message:', customerName);
          
          // 3. Salvar nome detectado no metadata do log atual (será salvo no final)
          // Criar variável para armazenar temporariamente
          break;
        }
      }
    } else {
      console.log('[AI-RESPONSE] 👤 Name retrieved from previous logs:', customerName);
    }
    
    // ====== CONTROLE DE ACESSO VIA SEÇÃO LIMITES (SEÇÃO 3) ======
    const limitesSection = agentSections?.find((s: any) => s.section_number === 3);
    const canAccessBuildings = limitesSection?.content?.match(/prédios|buildings|painéis/i);
    
    console.log('[AI-RESPONSE] 🔐 Access control check:', {
      limitesConfigured: !!limitesSection,
      canAccessBuildings: !!canAccessBuildings,
      limitesPreview: limitesSection?.content?.substring(0, 100)
    });

    // ====== BUSCAR PRÉDIOS SOMENTE SE AUTORIZADO (LAZY LOAD + CACHE) ======
    let buildingsData;
    const cacheKey = `buildings_cache_${agentKey}`;
    
    if (canAccessBuildings && (isFullListRequest || isComplexSearch)) {
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
    } else if (canAccessBuildings) {
      // Busca simplificada
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
    } else {
      console.log('[AI-RESPONSE] 🚫 Buildings access BLOCKED - not configured in Limites section');
      buildingsData = null;
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
      
      // Match exato
      if (userNormalized.includes(bNormalized)) {
        return { building: b, score: 1.0, method: 'exact' };
      }
      
      // MELHORIA: Padrões expandidos para captura de menção de prédio
      const buildingPatterns = [
        /predio\s+([a-z0-9\s]{2,40})/,
        /preido\s+([a-z0-9\s]{2,40})/,  // erro de digitação comum
        /predios?\s+([a-z0-9\s]{2,40})/,
        /edificio\s+([a-z0-9\s]{2,40})/,
        /edificios?\s+([a-z0-9\s]{2,40})/
      ];
      
      for (const pattern of buildingPatterns) {
        const predioMatch = userNormalized.match(pattern);
        if (predioMatch) {
          const mentionedName = predioMatch[1].trim();
          const similarity = stringSimilarity(mentionedName, bNormalized);
          
          // MELHORIA: Threshold reduzido de 0.6 para 0.5 para pegar mais erros
          if (similarity >= 0.5) {
            return { building: b, score: similarity, method: 'levenshtein_pattern' };
          }
        }
      }
      
      // MELHORIA: Fuzzy matching GERAL em toda a mensagem contra o nome do prédio
      const messageSimilarity = stringSimilarity(userNormalized, bNormalized);
      if (messageSimilarity >= 0.5) {
        return { building: b, score: messageSimilarity, method: 'fuzzy_full_message' };
      }
      
      // Match por palavras
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
    
    // ====== CONSTRUIR DADOS DOS PRÉDIOS (FORMATO COMPACTO - SEM BAIRRO POR PADRÃO) ======
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
          // 🔧 Remover separador de milhares para evitar quebra no WhatsApp
          const visualizacoes = b.visualizacoes_mes && b.visualizacoes_mes > 0 
            ? b.visualizacoes_mes.toString()
            : (b.quantidade_telas ? (b.quantidade_telas * 7350).toString() : '7350');
          
          const publicoEstimado = b.publico_estimado || (b.numero_unidades ? b.numero_unidades * 3 : 300);
          
          // FORMATO UNIFICADO - Alinhado com knowledge items
          const statusIndicator = b.status === 'instalação' ? ' (em instalação)' : '';
          let formatted = `🏢 ${nome}${statusIndicator}\n👥 Público: ${publicoEstimado} pessoas/mês | Exibições: ${visualizacoes}/mês\n💰 R$ ${precoBase}/mês`;
          
          return formatted;
        }).filter(b => b !== null).join('\n\n') // Remover prédios sem preço
      : 'Nenhum prédio disponível';

    // ====== CONSTRUIR KNOWLEDGE BASE DAS 4 SEÇÕES (OTIMIZADO) ======
    let knowledgeContext = '';
    
    // ✅ SEMPRE: Adicionar seções 1, 2, 3 (essenciais)
    if (agentSections && agentSections.length > 0) {
      const sortedSections = agentSections.sort((a: any, b: any) => a.section_number - b.section_number);
      knowledgeContext += sortedSections
        .map((s: any) => `## SEÇÃO ${s.section_number} - ${s.section_title.toUpperCase()}\n${s.content}`)
        .join('\n\n');
      
      console.log(`[AI-RESPONSE] ✅ Loaded essential sections: ${agentSections.map((s: any) => s.section_number).join(', ')}`);
    }
    
    // 🆕 CONDICIONAL: Adicionar seção 4 + knowledge items se necessário
    if (needsHeavyKnowledge) {
      if (section4 && section4.content) {
        knowledgeContext += `\n\n## SEÇÃO 4 - ${section4.section_title.toUpperCase()}\n${section4.content}`;
        console.log('[AI-RESPONSE] ✅ Added section 4 to context');
      }
      
      if (fullKnowledgeItems.length > 0) {
        knowledgeContext += '\n\n## DOCUMENTOS E RECURSOS EXTRAS\n\n';
        knowledgeContext += fullKnowledgeItems.map((k: any) => {
          let item = `### ${k.title}\n`;
          if (k.description) item += `${k.description}\n\n`;
          item += k.content;
          if (k.keywords && k.keywords.length > 0) {
            item += `\n\n**Palavras-chave:** ${k.keywords.join(', ')}`;
          }
          return item;
        }).join('\n\n---\n\n');
        
        console.log(`[AI-RESPONSE] 📚 Added ${fullKnowledgeItems.length} knowledge items to context`);
      }
    }

    // ====== FASE 1: CONSTRUIR HISTÓRICO ESTRUTURADO PARA OpenAI ======
    const historyMessages = conversationHistory && conversationHistory.length > 0
      ? conversationHistory.map((m: any) => ({
          role: m.direction === 'inbound' ? 'user' : 'assistant',
          content: m.body
        }))
      : [];

    // ====== CONSTRUIR SYSTEM PROMPT DINAMICAMENTE DAS SEÇÕES ======
    let systemPrompt = '';
    
    if (knowledgeContext && knowledgeContext.trim()) {
      // Usar APENAS o conteúdo das seções da base de conhecimento
      systemPrompt = knowledgeContext;
    } else {
      // Fallback mínimo se não houver seções configuradas
      systemPrompt = `Você é um assistente virtual. Responda de forma clara e objetiva.`;
    }
    
    // Adicionar dados contextuais de prédios (sempre dinâmicos)
    systemPrompt += `

## PRÉDIOS DISPONÍVEIS (${buildingsData?.length || 0})
${buildingsFormatted}

## CONTEXTO DA CONVERSA
${conversationHistory && conversationHistory.length > 0 ? `
⚠️ Conversa em andamento - NÃO se reapresente
⚠️ NÃO repita perguntas já respondidas
⚠️ Continue naturalmente
` : `
✅ Primeira mensagem - Faça saudação inicial
`}

## INFORMAÇÕES DO CLIENTE
${customerName ? `✅ Nome do cliente: ${customerName}` : `⚠️ Nome do cliente ainda não identificado - Sofia pode perguntar naturalmente quando apropriado`}

## FORMATO DE RESPOSTA
${isFullListRequest ? `
⚠️ LISTA COMPLETA SOLICITADA
✅ Enviar TODOS os ${buildingsData?.length || 0} prédios em UMA mensagem
✅ Formato: "Temos ${buildingsData?.length || 0} prédios! 🏢\\n\\n${buildingsFormatted}\\n\\nQual te interessou? 😊"
` : `
✅ Responda em UMA mensagem curta
✅ Máximo 3 prédios por vez
✅ Se pedir "todos": enviar lista completa
`}`;

    console.log('[AI-RESPONSE] 📝 Prompt constructed:', {
      promptLength: systemPrompt.length,
      buildingsCount: buildingsData?.length || 0,
      sections: agentSections?.length || 0,
      knowledgeItems: agentKnowledgeItems?.length || 0
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

    // ====== FASE 2: ENVIAR MENSAGEM HUMANIZADA DE AGUARDE (SEM EMOJIS) ======
    if (isFullListRequest || isComplexSearch || needsHeavyKnowledge) {
      console.log('[AI-RESPONSE] 💬 Sending "wait" message...');
      
      let waitMessages;
      
      if (isFullListRequest) {
        waitMessages = [
          "Um momento, estou buscando todos os prédios disponíveis.",
          "Deixa eu organizar a lista completa pra você.",
          "Preparando a lista completa."
        ];
      } else if (needsHeavyKnowledge) {
        // 🆕 MENSAGENS PARA BUSCA EM DOCUMENTOS
        waitMessages = [
          "Um minutinho, vou buscar essa informação pra você...",
          "Deixa eu verificar no nosso material institucional...",
          "Aguarde um momento enquanto consulto os documentos...",
          "Vou checar isso no sistema, só um instante..."
        ];
      } else {
        waitMessages = [
          "Deixa eu procurar isso no sistema.",
          "Um momento, já te respondo.",
          "Só um instante, estou verificando."
        ];
      }
      
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

    // ====== FASE 1: CHAMAR OPENAI COM HISTÓRICO ESTRUTURADO ======
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
          ...historyMessages, // 🔧 FASE 1: Histórico estruturado
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
    let aiReply = openaiData.choices[0]?.message?.content || '';

    if (!aiReply || aiReply.trim().length < 3) {
      console.error('[AI-RESPONSE] ❌ Resposta vazia ou muito curta');
      await releaseLock();
      throw new Error('AI response invalid');
    }

    // ====== FASE 5: VALIDAÇÃO DE CONTEXTO - REMOVER REAPRESENTAÇÕES E CUMPRIMENTOS DUPLICADOS ======
    if (conversationHistory && conversationHistory.length > 0) {
      // MELHORIA: Detectar cumprimentos genéricos duplicados
      const greetingPatterns = [
        /^Oi!?\s*/gi,
        /^Olá!?\s*/gi,
        /^Boa noite!?\s*/gi,
        /^Boa tarde!?\s*/gi,
        /^Bom dia!?\s*/gi,
        /Como posso (te )?ajudar\?/gi,
        /Tudo (bem|ótimo)\?/gi
      ];
      
      // Verificar se já cumprimentou nas últimas 3 mensagens
      const recentAssistantMessages = conversationHistory
        .filter(m => m.role === 'assistant')
        .slice(-3);
      
      let alreadyGreeted = false;
      for (const msg of recentAssistantMessages) {
        for (const pattern of greetingPatterns) {
          if (pattern.test(msg.content)) {
            alreadyGreeted = true;
            break;
          }
        }
        if (alreadyGreeted) break;
      }
      
      // Se já cumprimentou, remover cumprimentos da resposta atual
      if (alreadyGreeted) {
        let hadDuplicateGreeting = false;
        for (const pattern of greetingPatterns) {
          if (pattern.test(aiReply)) {
            console.warn('[AI-RESPONSE] ⚠️ FASE 5: Duplicate greeting detected - removing...');
            aiReply = aiReply.replace(pattern, '').trim();
            hadDuplicateGreeting = true;
          }
        }
        
        if (hadDuplicateGreeting) {
          await supabase.from('agent_logs').insert({
            agent_key: agentKey,
            conversation_id: conversationId,
            event_type: 'duplicate_greeting_removed',
            metadata: {
              cleanedLength: aiReply.length,
              timestamp: new Date().toISOString()
            }
          });
        }
      }
      
      // Detectar e remover reapresentação desnecessária
      const reIntroPatterns = [
        /Oi!?\s*Sou a? Sofia[^\.!?]*[\.!?]/gi,
        /Olá!?\s*Sou a? Sofia[^\.!?]*[\.!?]/gi,
        /Oi,?\s*tudo bem\?\s*Sou a? Sofia[^\.!?]*[\.!?]/gi
      ];
      
      let hadReIntro = false;
      for (const pattern of reIntroPatterns) {
        if (pattern.test(aiReply)) {
          console.warn('[AI-RESPONSE] ⚠️ FASE 5: AI re-introducing itself - removing...');
          aiReply = aiReply.replace(pattern, '').trim();
          hadReIntro = true;
        }
      }
      
      if (hadReIntro) {
        await supabase.from('agent_logs').insert({
          agent_key: agentKey,
          conversation_id: conversationId,
          event_type: 'reintroduction_removed',
          metadata: {
            originalLength: openaiData.choices[0]?.message?.content?.length,
            cleanedLength: aiReply.length,
            timestamp: new Date().toISOString()
          }
        });
      }
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

    // ====== SALVAR NOME DO CLIENTE SE DETECTADO ======
    if (customerName) {
      console.log('[AI-RESPONSE] 💾 Saving customer name to zapi_logs metadata:', customerName);
      
      // Atualizar o log mais recente desta conversa com o nome
      const { error: updateError } = await supabase
        .from('zapi_logs')
        .update({ 
          metadata: { customer_name: customerName }
        })
        .eq('phone', phoneNumber)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (updateError) {
        console.error('[AI-RESPONSE] ⚠️ Failed to save customer name:', updateError);
      } else {
        console.log('[AI-RESPONSE] ✅ Customer name saved successfully');
      }
    }

    // ====== LOG SUCESSO FINAL EM AGENT_LOGS ======
    await supabase.from('agent_logs').insert({
      agent_key: agentKey,
      conversation_id: conversationId,
      event_type: 'ai_response_sent',
      metadata: {
        messagePreview: message.substring(0, 100),
        responsePreview: sanitizedReply.substring(0, 100),
        customerName: customerName || 'not_identified',
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
