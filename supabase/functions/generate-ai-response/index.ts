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
    // 🆕 DETECTAR PERGUNTAS DE PREÇO/DESCONTO (precisa carregar seção 4)
    const isPriceRelated = message.match(/preço|valor|desconto|cupom|orçamento|plano|quanto|mensalidade|anual|semestral|trimestral|economizar|economia/i);
    const needsHeavyKnowledge = isKnowledgeSearch || isPriceRelated || false;
    
    // 🆕 DETECTAR PERGUNTAS DE PREÇO COM/SEM CUPOM
    const isPriceWithCoupon = message.match(/com\s*(o\s*)?(cupom|desconto|código)/i);
    const isPriceWithoutCoupon = message.match(/sem\s*(o\s*)?(cupom|desconto)/i);
    const isOppositeQuestion = message.match(/^e\s+(com|sem)/i); // "e sem cupom?", "e com desconto?"
    
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
      supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(15),
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
          
          // 🔧 Formatar valor monetário SEM separador de milhares (vírgula para centavos)
          const precoBase = b.preco_base.toFixed(2).replace('.', ',');
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

## ⚠️ REGRAS CRÍTICAS PARA PERGUNTAS DE PREÇO
${isPriceWithCoupon || isPriceWithoutCoupon || isOppositeQuestion ? `
🚨 ATENÇÃO: Cliente perguntou sobre preço específico!

${isPriceWithCoupon ? '→ Mostrar valor COM desconto aplicado' : ''}
${isPriceWithoutCoupon ? '→ Mostrar valor ORIGINAL (sem desconto)' : ''}
${isOppositeQuestion ? '→ Cliente quer o OPOSTO do que você respondeu antes!' : ''}

📌 REGRA OBRIGATÓRIA:
- Se perguntou "quanto COM cupom?" → mostrar valor descontado
- Se perguntou "quanto SEM cupom?" → mostrar valor ORIGINAL (maior)
- Se perguntou "e sem cupom?" após você dar preço COM desconto → mostrar valor SEM desconto
- SEMPRE mostrar a conta: "Valor original R$ X, com cupom fica R$ Y"

❌ NUNCA dê a mesma resposta se a pergunta é sobre COM vs SEM desconto!
` : ''}

## CONTEXTO DA CONVERSA
${conversationHistory && conversationHistory.length > 0 ? `
⚠️ Conversa em andamento - NÃO se reapresente
⚠️ NÃO repita perguntas já respondidas
⚠️ Continue naturalmente

📜 SUAS ÚLTIMAS RESPOSTAS (NÃO REPETIR O MESMO CONTEÚDO):
${conversationHistory.filter((m: any) => m.direction === 'outbound').slice(-2).map((m: any, i: number) => 
  `[${i+1}] ${m.body.substring(0, 150)}...`
).join('\n')}

⚠️ Se sua próxima resposta for muito parecida com as anteriores, REFORMULE!
` : `
✅ Primeira mensagem - Faça saudação inicial
`}

## INFORMAÇÕES DO CLIENTE
${customerName ? `✅ Nome do cliente: ${customerName}` : `⚠️ Nome do cliente ainda não identificado - Sofia pode perguntar naturalmente quando apropriado`}

## 🧮 REGRA CRÍTICA DE CÁLCULOS - OBRIGATÓRIO
⚠️⚠️⚠️ VOCÊ NÃO SABE CALCULAR - SEMPRE USE A FERRAMENTA! ⚠️⚠️⚠️

ATENÇÃO: Qualquer erro de cálculo é GRAVÍSSIMO para o negócio!

OBRIGAÇÕES ABSOLUTAS:
✅ SEMPRE use a ferramenta calcular_preco para QUALQUER menção de valor monetário
✅ SEMPRE confie 100% no resultado da ferramenta
✅ SEMPRE use os valores EXATOS que a ferramenta retornar

PROIBIÇÕES ABSOLUTAS:
❌ NUNCA calcule valores de cabeça
❌ NUNCA some, multiplique ou faça qualquer matemática manual
❌ NUNCA invente ou estime valores
❌ NUNCA use valores diferentes dos que a ferramenta retornou
❌ NUNCA arredonde valores por conta própria

POR QUE VOCÊ NÃO PODE CALCULAR:
- Você NÃO tem acesso aos preços reais do banco de dados
- Você VAI ERRAR nas multiplicações e descontos
- O site mostra os valores corretos - sua resposta PRECISA ser idêntica
- Divergências de valores destroem a confiança do cliente

QUANDO USAR A FERRAMENTA:
- Toda vez que mencionar "R$" ou valores monetários
- Perguntas sobre "quanto custa"
- Menção a descontos, cupons ou promoções
- Comparação de planos (mensal, trimestral, semestral, anual)
- Cálculo de múltiplos prédios
- QUALQUER situação envolvendo dinheiro

FORMATAÇÃO DE NÚMEROS:
- Valores monetários: "R$ 2.026,00" (com ponto de milhar e vírgula decimal)
- Números grandes (visualizações): "136800" (sem separadores, sem quebras de linha)
- NUNCA quebre números em linhas diferentes

## 🚨🚨🚨 REGRAS CRÍTICAS DE FORMATAÇÃO - LEIA COM ATENÇÃO 🚨🚨🚨

⚠️ NUNCA USE SEPARADOR DE MILHARES NOS NÚMEROS!
❌ ERRADO: 36.000, 14.400, 1.152, 36 000, 14 400
✅ CERTO: 36000, 14400, 1152

⚠️ NUNCA USE ASTERISCOS PARA NEGRITO!
❌ ERRADO: **Royal Legacy**, *texto*, **negrito**
✅ CERTO: Royal Legacy, texto, negrito

⚠️ NUNCA QUEBRE NÚMEROS EM LINHAS DIFERENTES!
❌ ERRADO: "Exibições: 36." (quebra) "000/mês"
✅ CERTO: "Exibições: 36000/mês" (tudo em uma linha)

⚠️ ESCREVA OS NÚMEROS SEMPRE SEM PONTOS E SEM ESPAÇOS!
Exemplos CORRETOS:
- 36000/mês (não 36.000/mês)
- 14400/mês (não 14.400/mês)
- 1152/mês (não 1.152/mês)
- 7200 pessoas (não 7.200 pessoas)

🚫 Se você usar pontos ou espaços nos números, o WhatsApp vai QUEBRAR a mensagem e o cliente vai ver "36." em uma linha e "000/mês" em outra!

## FORMATO DE RESPOSTA
${isFullListRequest ? `
⚠️ LISTA COMPLETA SOLICITADA
✅ Enviar TODOS os ${buildingsData?.length || 0} prédios em UMA mensagem
✅ Formato: "Temos ${buildingsData?.length || 0} prédios! 🏢\\n\\n${buildingsFormatted}\\n\\nQual te interessou? 😊"
` : `
✅ Responda em UMA mensagem curta
✅ Máximo 3 prédios por vez
✅ Se pedir "todos": enviar lista completa
`}

## 🚀 ESCALAÇÃO INTELIGENTE PARA EDUARDO

QUANDO VOCÊ PERCEBER que o cliente:
- Está indeciso e precisa de um empurrãozinho humano para fechar
- Pediu condição especial, desconto extra ou negociação
- Mencionou múltiplas empresas, franquias ou grande volume
- Tem dúvidas complexas que você não consegue resolver sozinha
- Parece estar prestes a fechar mas precisa de conversa mais personalizada
- Expressou objeções que um humano resolveria melhor
- Demonstra frustração ou insatisfação
- Quer falar com alguém "de verdade" ou um vendedor

→ ADICIONE ao FINAL da sua resposta a tag: [ESCALAR:motivo_breve]

⚠️ IMPORTANTE: 
- A tag [ESCALAR:...] será REMOVIDA automaticamente antes de enviar ao cliente
- O cliente NUNCA verá essa tag
- Use com sabedoria - apenas quando realmente precisar de intervenção humana

✅ EXEMPLOS DE RESPOSTA COM ESCALAÇÃO:

Exemplo 1 (desconto especial):
"Entendo que você quer uma condição melhor! Vou chamar meu colega Eduardo, ele é especialista em encontrar o melhor custo-benefício pra você. Ele vai entrar em contato rapidinho! Enquanto isso, posso te ajudar com mais alguma dúvida?"
[ESCALAR:cliente pediu desconto especial para 3 prédios]

Exemplo 2 (múltiplas empresas):
"Que legal que você tem interesse pra mais de uma empresa! O Eduardo é a pessoa certa pra te ajudar com isso, ele consegue montar uma proposta personalizada pra vocês. Vou avisar ele agora mesmo!"
[ESCALAR:cliente tem 2 empresas, quer proposta conjunta]

Exemplo 3 (indecisão):
"Percebo que você ainda tá na dúvida... Olha, vou chamar o Eduardo que ele tem mais jogo de cintura pra te ajudar a decidir. Ele conhece bem as necessidades de cada tipo de negócio e vai te dar uma atenção especial!"
[ESCALAR:cliente indeciso após várias mensagens, precisa de toque humano]

❌ NÃO ESCALAR PARA:
- Dúvidas simples sobre preço (use calcular_preco)
- Perguntas sobre formas de pagamento (você tem essa info)
- Informações básicas sobre prédios
- Cliente apenas explorando, sem intenção clara`;

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

    // ====== DEFINIR TOOL CALCULAR_PRECO ======
    const tools = [
      {
        type: "function",
        function: {
          name: "calcular_preco",
          description: "Calcula preços de prédios com precisão matemática. SEMPRE use esta ferramenta para qualquer cálculo de valor, orçamento ou desconto. NUNCA calcule manualmente.",
          parameters: {
            type: "object",
            properties: {
              predios: {
                type: "string",
                description: "Quais prédios calcular: 'todos' para todos os prédios disponíveis, ou nomes específicos separados por vírgula"
              },
              quantidade: {
                type: "number",
                description: "Se o cliente mencionou uma quantidade específica de prédios (opcional)"
              },
              plano: {
                type: "string",
                enum: ["mensal", "trimestral", "semestral", "anual"],
                description: "Plano de contratação. Mensal = sem desconto, Trimestral = 20% OFF, Semestral = 30% OFF, Anual = 37.5% OFF"
              },
              cupom: {
                type: "string",
                description: "Código do cupom promocional se o cliente mencionou algum (opcional)"
              }
            },
            required: ["predios"]
          }
        }
      }
    ];

    // ====== FASE 1: CHAMAR OPENAI COM HISTÓRICO ESTRUTURADO + TOOLS ======
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
        tools: tools,
        tool_choice: "auto",
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
    const firstMessage = openaiData.choices[0]?.message;
    let tokensUsed = openaiData.usage?.total_tokens || 0;
    
    // Variável para guardar resultado da função para validação posterior
    let toolFunctionResult: any = null;
    
    // ====== PROCESSAR TOOL CALLS ======
    if (firstMessage?.tool_calls && firstMessage.tool_calls.length > 0) {
      console.log('[AI-RESPONSE] 🛠️ Tool call detected:', firstMessage.tool_calls[0].function.name);
      
      const toolCall = firstMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      
      console.log('[AI-RESPONSE] 📊 Function arguments:', functionArgs);
      
      let functionResult = null;
      
      // ====== HANDLER: calcular_preco ======
      if (functionName === 'calcular_preco') {
        try {
          // 1. BUSCAR PRÉDIOS DO BANCO
          let query = supabase
            .from('buildings')
            .select('id, nome, preco_base, bairro')
            .eq('status', 'ativo');
          
          if (functionArgs.predios !== 'todos') {
            const nomesArray = functionArgs.predios.split(',').map((n: string) => n.trim());
            query = query.in('nome', nomesArray);
          }
          
          const { data: predios, error: prediosError } = await query;
          
          if (prediosError) {
            console.error('[AI-RESPONSE] ❌ Error fetching buildings for calculation:', prediosError);
            functionResult = { error: 'Erro ao buscar prédios do banco de dados' };
          } else if (!predios || predios.length === 0) {
            functionResult = { error: 'Nenhum prédio encontrado com os critérios informados' };
          } else {
            // 2. CALCULAR SUBTOTAL
            const subtotal = predios.reduce((sum, p) => sum + (p.preco_base || 0), 0);
            
            console.log('[AI-RESPONSE] 💰 Subtotal calculated:', subtotal);
            
            // 3. BUSCAR CUPOM SE INFORMADO
            let descontoCupom = 0;
            let cupomInfo = null;
            
            if (functionArgs.cupom) {
              const { data: cupom, error: cupomError } = await supabase
                .from('coupons')
                .select('*')
                .ilike('codigo', functionArgs.cupom)
                .eq('ativo', true)
                .maybeSingle();
              
              if (!cupomError && cupom) {
                descontoCupom = cupom.desconto_percentual / 100;
                cupomInfo = {
                  codigo: cupom.codigo,
                  desconto: cupom.desconto_percentual,
                  tipo: cupom.tipo_desconto
                };
                console.log('[AI-RESPONSE] 🎟️ Cupom found:', cupomInfo);
              } else {
                console.log('[AI-RESPONSE] ⚠️ Cupom not found or inactive:', functionArgs.cupom);
              }
            }
            
            // 4. CALCULAR PARA CADA PLANO (com fórmula de multiplicação correta)
            const planosConfig: Record<string, { meses: number; desconto: number }> = {
              mensal: { meses: 1, desconto: 0 },
              trimestral: { meses: 3, desconto: 0.20 },
              semestral: { meses: 6, desconto: 0.30 },
              anual: { meses: 12, desconto: 0.375 }
            };
            
            const resultados: Record<string, any> = {};
            
            for (const [nomePlano, config] of Object.entries(planosConfig)) {
              // 🔧 FÓRMULA CORRETA: Multiplicar descontos (1 - d1) * (1 - d2)
              const multiplicadorDesconto = (1 - config.desconto) * (1 - descontoCupom);
              const valorMensal = subtotal * multiplicadorDesconto;
              const valorTotal = valorMensal * config.meses;
              const economiaTotal = (subtotal * config.meses) - valorTotal;
              
              resultados[nomePlano] = {
                meses: config.meses,
                desconto_plano_percentual: (config.desconto * 100).toFixed(1),
                desconto_cupom_percentual: (descontoCupom * 100).toFixed(1),
                valor_mensal: valorMensal.toFixed(2).replace('.', ','),
                valor_total: valorTotal.toFixed(2).replace('.', ','),
                economia_total: economiaTotal.toFixed(2).replace('.', ',')
              };
            }
            
            // 5. MONTAR RESULTADO
            functionResult = {
              total_predios: predios.length,
              predios_incluidos: predios.map(p => p.nome),
              subtotal_mensal_sem_desconto: subtotal.toFixed(2).replace('.', ','),
              cupom_aplicado: cupomInfo || 'nenhum',
              planos: resultados,
              observacao: 'Valores já formatados com vírgula para centavos. Use exatamente como está.'
            };
            
            // Guardar para validação posterior
            toolFunctionResult = functionResult;
            
            console.log('[AI-RESPONSE] ✅ Calculation complete:', JSON.stringify(functionResult, null, 2));
          }
        } catch (calcError) {
          console.error('[AI-RESPONSE] ❌ Error in calcular_preco:', calcError);
          functionResult = { error: 'Erro ao processar cálculo de preços' };
        }
      }
      
      // ====== LOG TOOL CALL ======
      await supabase.from('agent_logs').insert({
        agent_key: agentKey,
        conversation_id: conversationId,
        event_type: 'tool_call_executed',
        metadata: {
          tool: functionName,
          arguments: functionArgs,
          result: functionResult,
          timestamp: new Date().toISOString()
        }
      });
      
      // ====== SEGUNDA CHAMADA AO GPT COM RESULTADO DA FUNÇÃO ======
      console.log('[AI-RESPONSE] 🔄 Calling GPT again with function result...');
      
      const secondResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyMessages,
            { role: 'user', content: message },
            firstMessage, // Mensagem original com tool_call
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              name: functionName,
              content: JSON.stringify(functionResult)
            }
          ],
          temperature: 0.7,
          max_tokens: maxTokens,
        }),
      });
      
      if (!secondResponse.ok) {
        const errorText = await secondResponse.text();
        console.error('[AI-RESPONSE] ❌ Second OpenAI call error:', secondResponse.status, errorText);
        throw new Error(`OpenAI second call error: ${secondResponse.status}`);
      }
      
      const secondData = await secondResponse.json();
      aiReply = secondData.choices[0]?.message?.content || '';
      tokensUsed += secondData.usage?.total_tokens || 0;
      
      console.log('[AI-RESPONSE] ✅ Got formatted response from GPT with function result');
      
      // ====== VALIDAÇÃO PÓS-RESPOSTA: Verificar se valores correspondem ======
      if (toolFunctionResult && toolFunctionResult.planos) {
        console.log('[AI-RESPONSE] 🔍 Iniciando validação de valores na resposta...');
        
        // Extrair todos os valores monetários da resposta (formato R$ X.XXX,XX ou R$ XXX,XX)
        const valoresNaResposta = aiReply.match(/R\$\s*[\d.]+,\d{2}/g) || [];
        console.log('[AI-RESPONSE] 💰 Valores encontrados na resposta:', valoresNaResposta);
        
        // Valores esperados da função (formato com ponto de milhar e vírgula decimal)
        const valoresEsperados: string[] = [];
        Object.values(toolFunctionResult.planos).forEach((plano: any) => {
          // Formatar com ponto de milhar e vírgula decimal (padrão brasileiro)
          const valorMensalStr = plano.valor_mensal.replace(',', '.'); // Converter para ponto
          const valorTotalStr = plano.valor_total.replace(',', '.'); // Converter para ponto
          const valorMensalNum = parseFloat(valorMensalStr);
          const valorTotalNum = parseFloat(valorTotalStr);
          
          valoresEsperados.push(`R$ ${valorMensalNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          valoresEsperados.push(`R$ ${valorTotalNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        });
        
        console.log('[AI-RESPONSE] ✅ Valores esperados da função:', valoresEsperados);
        
        // Detectar divergências (valores na resposta que não estão nos esperados)
        const divergencias: string[] = [];
        valoresNaResposta.forEach(valor => {
          // Normalizar espaços para comparação
          const valorNormalizado = valor.replace(/\s+/g, ' ');
          const encontrado = valoresEsperados.some(esperado => 
            esperado.replace(/\s+/g, ' ') === valorNormalizado
          );
          
          if (!encontrado) {
            divergencias.push(valor);
          }
        });
        
        if (divergencias.length > 0) {
          console.error('[AI-RESPONSE] ❌ ERRO CRÍTICO: DIVERGÊNCIA DE VALORES DETECTADA!');
          console.error('[AI-RESPONSE] Valores INCORRETOS na resposta:', divergencias);
          console.error('[AI-RESPONSE] Valores CORRETOS esperados:', valoresEsperados);
          console.error('[AI-RESPONSE] Resposta completa:', aiReply);
          
          // Logar no banco para análise e alertas
          await supabase.from('agent_logs').insert({
            agent_key: agentKey,
            conversation_id: conversationId,
            event_type: 'price_validation_error',
            metadata: {
              valores_incorretos: divergencias,
              valores_corretos: valoresEsperados,
              resposta_completa: aiReply,
              calculo_funcao: toolFunctionResult,
              timestamp: new Date().toISOString(),
              severity: 'CRITICAL'
            }
          });
        } else {
          console.log('[AI-RESPONSE] ✅ VALIDAÇÃO OK: Todos os valores correspondem ao cálculo da função');
          
          // Logar sucesso
          await supabase.from('agent_logs').insert({
            agent_key: agentKey,
            conversation_id: conversationId,
            event_type: 'price_validation_success',
            metadata: {
              valores_validados: valoresNaResposta.length,
              timestamp: new Date().toISOString()
            }
          });
        }
      }
      
    } else {
      // Resposta normal sem tool call
      aiReply = firstMessage?.content || '';
    }

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
            originalLength: firstMessage?.content?.length || 0,
            cleanedLength: aiReply.length,
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // ====== ETAPA 1 + 2: FUNÇÕES DE LIMPEZA MELHORADAS ======
    
    // ETAPA 1: Limpeza de separadores de milhares (MELHORADO - mais agressivo)
    const cleanNumberSeparators = (text: string): string => {
      // Remove ponto como separador de milhares (14.400 → 14400, 1.152 → 1152)
      // Regex melhorado: captura números mesmo com quebras de linha
      let cleaned = text.replace(/(\d{1,3})\.(\d{3})(?!\d)/g, '$1$2');
      
      // Remove múltiplos pontos de milhares (ex: 1.234.567 → 1234567)
      while (cleaned.match(/(\d{1,3})\.(\d{3})(?!\d)/)) {
        cleaned = cleaned.replace(/(\d{1,3})\.(\d{3})(?!\d)/g, '$1$2');
      }
      
      // Remove espaço como separador de milhares (14 400 → 14400)
      cleaned = cleaned.replace(/(\d+)\s+(\d{3})(?!\d)/g, '$1$2');
      
      // 🔧 NOVO: Remove quebras de linha no meio de números (36.\n000 → 36000)
      cleaned = cleaned.replace(/(\d+)\.\s*\n\s*(\d{3})/g, '$1$2');
      
      return cleaned;
    };
    
    // ETAPA 2: Limpeza de formatação Markdown (NOVO)
    const cleanMarkdownFormatting = (text: string): string => {
      // Remove negrito duplo: **texto** → texto
      let cleaned = text.replace(/\*\*([^*]+)\*\*/g, '$1');
      
      // Remove itálico simples: *texto* → texto
      cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
      
      return cleaned;
    };

    // ====== ETAPA 5: LOGGING DETALHADO + ETAPA 4: LIMPEZA ANTES DE TUDO ======
    console.log('[AI-RESPONSE] 🧹 Starting cleanup process...');
    console.log('[BEFORE CLEAN - RAW AI RESPONSE]:', aiReply.substring(0, 300));
    
    // Sanitizar resposta básica
    let sanitizedReply = aiReply
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    console.log('[BEFORE CLEAN - AFTER BASIC SANITIZATION]:', sanitizedReply.substring(0, 300));
    
    // ETAPA 4: Aplicar limpezas ANTES de qualquer outra operação
    const beforeNumberClean = sanitizedReply;
    sanitizedReply = cleanNumberSeparators(sanitizedReply);
    
    console.log('[AFTER CLEAN - NUMBER SEPARATORS]:', sanitizedReply.substring(0, 300));
    
    const beforeMarkdownClean = sanitizedReply;
    sanitizedReply = cleanMarkdownFormatting(sanitizedReply);
    
    console.log('[AFTER CLEAN - MARKDOWN FORMATTING]:', sanitizedReply.substring(0, 300));
    
    // Log de mudanças detectadas
    if (beforeNumberClean !== sanitizedReply) {
      console.log('[AI-RESPONSE] 🧹 Cleaned number separators from AI response');
      await supabase.from('agent_logs').insert({
        agent_key: agentKey,
        conversation_id: conversationId,
        event_type: 'number_separators_cleaned',
        metadata: {
          before: beforeNumberClean.substring(0, 300),
          after: sanitizedReply.substring(0, 300),
          changes: sanitizedReply !== beforeNumberClean,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    if (beforeMarkdownClean !== sanitizedReply) {
      console.log('[AI-RESPONSE] 🧹 Cleaned markdown formatting from AI response');
      await supabase.from('agent_logs').insert({
        agent_key: agentKey,
        conversation_id: conversationId,
        event_type: 'markdown_formatting_cleaned',
        metadata: {
          before: beforeMarkdownClean.substring(0, 300),
          after: sanitizedReply.substring(0, 300),
          changes: sanitizedReply !== beforeMarkdownClean,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    console.log('[FINAL CLEAN MESSAGE]:', sanitizedReply.substring(0, 300));

    // ====== VALIDAÇÃO ANTI-REPETIÇÃO ======
    const recentAssistantResponses = conversationHistory
      ?.filter((m: any) => m.direction === 'outbound')
      .slice(-3) || [];

    for (const lastResponse of recentAssistantResponses) {
      const similarity = stringSimilarity(
        normalizeName(sanitizedReply.substring(0, 100)),
        normalizeName(lastResponse.body.substring(0, 100))
      );
      
      if (similarity > 0.7) {
        console.warn('[AI-RESPONSE] ⚠️ RESPOSTA REPETITIVA DETECTADA!', { 
          similarity: `${(similarity * 100).toFixed(1)}%` 
        });
        
        // Log para análise
        await supabase.from('agent_logs').insert({
          agent_key: agentKey,
          conversation_id: conversationId,
          event_type: 'repetitive_response_detected',
          metadata: {
            similarity: similarity,
            newResponse: sanitizedReply.substring(0, 200),
            previousResponse: lastResponse.body.substring(0, 200),
            timestamp: new Date().toISOString()
          }
        });
        
        // RETRY com prompt forçando variação
        const retryMessages = [
          { role: 'system', content: systemPrompt },
          ...historyMessages,
          { role: 'user', content: message },
          { 
            role: 'system', 
            content: `⚠️ ATENÇÃO: Sua resposta anterior foi "${lastResponse.body.substring(0, 100)}..."
        
O cliente NÃO quer a mesma resposta! Ele perguntou algo DIFERENTE.
Se ele perguntou "sem cupom" depois de você dar preço "com cupom", mostre o valor ORIGINAL!
REFORMULE completamente sua resposta!` 
          }
        ];
        
        const retryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: retryMessages,
            temperature: 0.9, // Mais criatividade no retry
            max_tokens: maxTokens,
          }),
        });
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          const retryReply = retryData.choices[0]?.message?.content?.trim();
          if (retryReply && retryReply.length > 10) {
            sanitizedReply = cleanMarkdownFormatting(cleanNumberSeparators(retryReply));
            console.log('[AI-RESPONSE] ✅ Retry successful - different response generated');
          }
        }
        break;
      }
    }

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

    // ====== DETECÇÃO DE ESCALAÇÃO COMERCIAL (EDUARDO) ======
    // MÉTODO 1: ESCALAÇÃO INTELIGENTE - Sofia decide via tag [ESCALAR:motivo]
    const escalationMatch = sanitizedReply.match(/\[ESCALAR:([^\]]+)\]/i);
    let shouldEscalate = false;
    let escalationReason = '';
    let escalationMethod = '';
    
    if (escalationMatch) {
      shouldEscalate = true;
      escalationReason = escalationMatch[1].trim();
      escalationMethod = 'intelligent_ai_decision';
      
      // REMOVER a tag da resposta antes de enviar ao cliente
      sanitizedReply = sanitizedReply.replace(/\[ESCALAR:[^\]]+\]/gi, '').trim();
      
      console.log('[AI-RESPONSE] 🚀 INTELLIGENT ESCALATION - Sofia decided to escalate');
      console.log('[AI-RESPONSE] 📝 Reason from Sofia:', escalationReason);
    }
    
    // MÉTODO 2: FALLBACK - Detecção por keywords na mensagem do cliente
    if (!shouldEscalate) {
      const escalationKeywords = /grupo.*empresa|mais.*desconto|desconto.*especial|condição.*especial|condição.*diferenciada|várias.*empresas|muitos.*prédios|grande.*quantidade|negociação|negociar.*preço|falar.*vendedor|falar.*comercial|preciso.*melhor.*preço|desconto.*maior|(\d+|duas?|três|várias?)\s*empresas?/i;
      
      if (message.match(escalationKeywords)) {
        shouldEscalate = true;
        escalationReason = `Keyword detected: "${message.substring(0, 100)}"`;
        escalationMethod = 'keyword_fallback';
        
        console.log('[AI-RESPONSE] 🚀 KEYWORD FALLBACK ESCALATION - Detected keywords in message');
      }
    }
    
    // Se precisa escalar (por qualquer método)
    if (shouldEscalate) {
      console.log('[AI-RESPONSE] 🚀 ESCALATION TRIGGERED via:', escalationMethod);
      
      // Buscar resumo do histórico
      const conversationSummary = conversationHistory?.slice(-5).map((m: any) => 
        `${m.direction === 'inbound' ? 'Cliente' : 'Sofia'}: ${m.body?.substring(0, 100)}`
      ).join('\n') || '';
      
      // Primeira mensagem do lead
      const firstLeadMessage = conversationHistory?.find((m: any) => m.direction === 'inbound')?.body || message;
      
      // Detectar possível segmento/interesse
      let leadSegment = null;
      let leadInterest = null;
      const plansInterested: string[] = [];
      
      const fullHistory = conversationHistory?.map((m: any) => m.body).join(' ') || message;
      
      if (fullHistory.match(/restaurante|lanchonete|bar|café/i)) leadSegment = 'Alimentação';
      if (fullHistory.match(/academia|fitness|crossfit/i)) leadSegment = 'Fitness';
      if (fullHistory.match(/imobiliár|corretor|apartamento/i)) leadSegment = 'Imobiliário';
      if (fullHistory.match(/clínica|médico|consultório|saúde/i)) leadSegment = 'Saúde';
      if (fullHistory.match(/escola|curso|educação|faculdade/i)) leadSegment = 'Educação';
      if (fullHistory.match(/loja|comércio|varejo/i)) leadSegment = 'Varejo';
      
      if (fullHistory.match(/anunciar|divulgar|propaganda|publicidade/i)) leadInterest = 'Anunciar';
      if (fullHistory.match(/síndico|condomínio|prédio/i)) leadInterest = 'Síndico';
      
      if (fullHistory.match(/mensal|1\s*mês/i)) plansInterested.push('Mensal');
      if (fullHistory.match(/trimestral|3\s*meses/i)) plansInterested.push('Trimestral');
      if (fullHistory.match(/semestral|6\s*meses/i)) plansInterested.push('Semestral');
      if (fullHistory.match(/anual|12\s*meses/i)) plansInterested.push('Anual');
      
      // Análise da Sofia - inclui motivo dela se disponível
      const aiAnalysis = escalationMethod === 'intelligent_ai_decision'
        ? `🤖 Sofia decidiu escalar: "${escalationReason}"\n\nÚltima mensagem do cliente: "${message.substring(0, 150)}"`
        : `Cliente pediu: "${message.substring(0, 150)}"\nSofia identificou interesse em condições especiais/negociação que requer intervenção humana.`;
      
      try {
        // Chamar notify-escalation
        const escalationResult = await supabase.functions.invoke('notify-escalation', {
          body: {
            conversationId,
            phoneNumber,
            leadName: customerName,
            leadSegment,
            leadInterest,
            plansInterested,
            firstMessage: firstLeadMessage,
            conversationSummary,
            aiAnalysis,
            escalationMethod,
            escalationReason
          }
        });
        
        console.log('[AI-RESPONSE] ✅ Escalation sent:', escalationResult.data);
        
        // Log detalhado
        await supabase.from('agent_logs').insert({
          agent_key: agentKey,
          conversation_id: conversationId,
          event_type: 'escalation_triggered',
          metadata: {
            phone: phoneNumber,
            trigger_message: message,
            escalation_id: escalationResult.data?.escalacaoId,
            notified_count: escalationResult.data?.notified,
            escalation_method: escalationMethod,
            escalation_reason: escalationReason,
            timestamp: new Date().toISOString()
          }
        });
      } catch (escalationError) {
        console.error('[AI-RESPONSE] ❌ Escalation error:', escalationError);
      }
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
        tokensUsed: tokensUsed,
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
      // 🛡️ FARC FIX: Detectar se mensagem contém links (Google Drive, examidia, etc)
      const hasLinks = sanitizedReply.match(/https?:\/\/|www\./i);
      
      const result = await supabase.functions.invoke('zapi-send-message', {
        body: {
          agentKey,
          phone: phoneNumber,
          message: sanitizedReply,
          skipSplit: hasLinks ? true : undefined  // Não quebrar mensagens com links
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
