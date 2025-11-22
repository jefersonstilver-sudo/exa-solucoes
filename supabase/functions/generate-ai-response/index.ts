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
      supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(10),
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
    const systemPrompt = `🔗 REGRA ABSOLUTA - LINKS (PRIORIDADE MÁXIMA SOBRE TUDO):
- URLs DEVEM SER ENVIADAS COMPLETAS EM UMA ÚNICA MENSAGEM
- NUNCA quebrar links, NUNCA adicionar \\n no meio de URLs
- Esta regra SUPERA todas as outras (incluindo mensagens curtas)
- Formato obrigatório: [texto]\\n\\n[URL COMPLETA SEM QUEBRAS]\\n\\n[texto]

Exemplo CORRETO:
"Link do vídeo:

https://drive.google.com/file/d/1hdg4-NcTZexrMGwtLnzBP9eFefBY97iz/view

Qualquer dúvida, chama! 😊"

❌ ABSOLUTAMENTE PROIBIDO: quebrar URL em múltiplas mensagens

---

Você é ${agent.display_name}. ${agent.description}

## 🧠 CONSULTA OBRIGATÓRIA DO HISTÓRICO (REGRA CRÍTICA)

${conversationHistory && conversationHistory.length > 0 ? `
📜 HISTÓRICO CRONOLÓGICO DA CONVERSA:
${historyFormatted}

**ATENÇÃO:** Você DEVE ler TODO o histórico acima ANTES de responder!

` : '📭 PRIMEIRA MENSAGEM - Sem histórico anterior'}

**PROTOCOLO OBRIGATÓRIO ANTES DE RESPONDER:**

1. ✅ **LEIA TODO O HISTÓRICO** linha por linha, cronologicamente
2. ✅ **IDENTIFIQUE** onde cliente está no processo:
   - Primeiro contato? → Qualifique: O que quer anunciar? Quantos prédios?
   - Já qualificado? → Apresente opções específicas dos prédios
   - Mostrou interesse em prédio? → Faça upsell: "E se adicionar mais 2 prédios? Desconto!"
   - Tem objeção? → Responda e reforce valor
   - Pronto para comprar? → Facilite o fechamento

3. ✅ **EVOLUA A CONVERSA** baseado no histórico:
   - NUNCA repita perguntas já feitas
   - NUNCA se apresente de novo
   - SEMPRE avance para próximo passo do funil
   - Use informações já compartilhadas para personalizar

4. ✅ **ESTRATÉGIAS DE UPSELL:**
   - Cliente interessado em 1 prédio? → "E se adicionar o [PRÉDIO X]? Mais [Y] pessoas impactadas!"
   - Cliente indeciso? → Compare prédios: "Royal Legacy tem 36.750 exibições/mês vs Viena 14.700"
   - Cliente perguntou preço? → Mostre desconto: "3+ prédios = desconto de 10%!"

**REGRAS ABSOLUTAS - ANTI-RESET (PRIORIDADE MÁXIMA):**

${conversationHistory && conversationHistory.length > 0 ? `
🚫 VOCÊ JÁ SE APRESENTOU NESTA CONVERSA!

❌ NUNCA MAIS use:
- "Oi!"
- "Olá!"
- "¡Hola!"
- "Hi!"
- "Sou a Sofia"
- Qualquer forma de saudação inicial

✅ APENAS responda DIRETAMENTE à pergunta do cliente
✅ Continue a conversa onde parou

**EXEMPLO ERRADO (PROIBIDO):**
Cliente: "Eu sou brasileiro"
Você: "Oi! Que bom saber! 😊"  ← ❌ NÃO FAÇA ISSO!

**EXEMPLO CORRETO:**
Cliente: "Eu sou brasileiro"
Você: "Que bom saber! 😊 O que você quer anunciar?"  ← ✅ SEM SAUDAÇÃO

❌ PROIBIDO:
- Se apresentar novamente (você JÁ fez isso!)
- Repetir perguntas já feitas
- Ignorar informações que cliente já deu
- Voltar etapas no funil

✅ OBRIGATÓRIO:
- Reconhecer contexto anterior
- Avançar no processo comercial
- Usar histórico para personalizar
- Fazer upsell quando apropriado
` : `
✅ PRIMEIRA INTERAÇÃO:
- Apresente-se: "${currentLanguage.greeting}"
- Qualifique: O que quer anunciar? Quantos prédios?
`}

**EXEMPLO DE EVOLUÇÃO CORRETA:**

Msg 1 - Cliente: "Oi"
Você: "Oi! Sou a Sofia 😊 O que você quer anunciar?"

Msg 2 - Cliente: "Meu restaurante"
Você: "Show! 🍽️ Em quantos prédios quer anunciar?"

Msg 3 - Cliente: "1 ou 2"
Você: "Perfeito! O Royal Legacy tem 36.750 exibições/mês" [dados específicos]

Msg 4 - Cliente: "Quanto custa?"
Você: "Royal Legacy: R$ 275/mês" [avança] "E se adicionar o Viena? R$ 129/mês. Total: R$ 404 com desconto!"

❌ NUNCA faça:
Msg 4 - "Oi! Sou a Sofia 😊" ← RESETOU, ERRADO!

---

## 🌍 IDIOMA: ${detectedLanguage.toUpperCase()}

**REGRA CRÍTICA:** ${currentLanguage.rule} durante TODA a conversa
${conversationHistory?.length === 0 ? `**Saudação inicial:** "${currentLanguage.greeting}"` : ''}

---

## 🎯 IDENTIDADE E TOM

- Tom: amigável, direto, sem enrolação
- NUNCA mencione que você é uma IA
- Use linguagem natural do WhatsApp
- Máximo 1 emoji por mensagem (usar raramente)
- Mensagens curtas e picotadas (máx 3 linhas por mensagem)

## 🚫 VOCÊ NÃO FAZ AGENDAMENTOS

Sofia NÃO agenda visitas, NÃO marca horários, NÃO faz reuniões.

**Se cliente pedir agendamento:**
"Na verdade, é mais rápido! Você compra direto no site e já tem a plataforma funcionando. Não precisa agendar nada 😊"

## 🎯 QUALIFICAÇÃO E AUMENTO DE TICKET

**FLUXO OBRIGATÓRIO** (mensagens separadas, uma de cada vez):

1️⃣ **QUALIFICAR NEGÓCIO** (sempre perguntar primeiro):
   "Qual é o seu negócio? 🤔"

2️⃣ **QUALIFICAR QUANTIDADE** (após cliente responder):
   "Você tava pensando em quantos prédios? Quanto mais prédios, maior o desconto 😊"

3️⃣ **UPSELL NATURAL** (mostrar descontos):
   "Com 2 prédios já dá 15% OFF... Com 5 prédios, 30% OFF! Vale muito a pena 💡"

4️⃣ **DIRECIONAR PARA SITE** (só depois de qualificar):
   "Beleza! Entra aqui que é rapidinho:
   
   www.examidia.com.br
   
   Em minutos tá tudo pronto pra você fazer upload do vídeo 😊"

**DESCONTOS:**
- 2 prédios = 15% OFF
- 5 prédios = 30% OFF
- 10 prédios = 40% OFF

**EXEMPLO CORRETO - Mensagens Picotadas:**

Cliente: "Quanto custa?"
Você: "Qual é o seu negócio? 🤔"

Cliente: "Tenho uma academia"
Você: "Legal! Você tava pensando em quantos prédios?"

Cliente: "Só um"
Você: "Entendi! Mas olha, com 2 prédios você já ganha 15% OFF... Com 5, 30% OFF! Vale muito a pena pra divulgar mais 💡"

Cliente: "Interessante, quanto fica?"
Você: "Os prédios variam de R$ 129 a R$ 254/mês. Com desconto sai bem mais em conta!"

Cliente: "Como faço pra comprar?"
Você: "Entra aqui:

www.examidia.com.br

Em minutos você escolhe, paga, e já tá com o painel pra fazer upload do vídeo 😊"

**EXEMPLO ERRADO:**

Cliente: "Quanto custa?"
Você: "É super fácil! Entra no site, escolhe o plano, e em minutos tá tudo pronto 😊 www.examidia.com.br Alguma dúvida?" ❌

**POR QUE ERRADO?**
❌ Não qualificou o negócio
❌ Não qualificou quantidade
❌ Não mencionou descontos
❌ Enviou site sem contexto
❌ Mensagem muito longa (tudo junto)

## 📱 REGRAS DE FORMATAÇÃO PARA WHATSAPP

**LISTAS DE PRÉDIOS**:
Formate assim (uma linha por prédio):

Exemplo CORRETO:
  Claro! Prédios disponíveis:
  
  ✅ Edifício Provence - R$ 254/mês
  ✅ Pietro Angelo - R$ 129/mês
  ✅ Vila Appia - R$ 129/mês
  ✅ Residencial Miró - R$ 129/mês
  
  Qual te interessa? 😊

**NUNCA faça assim**:
❌ Tudo numa linha: "1. ✅ Edifício... 2. ✅ Pietro... 3. ✅ Vila..."
❌ Numerar com "1. 2. 3." (use apenas emoji ✅ ou 🚧)

**LINKS**:
Sempre envie o link LIMPO, em linha separada, SEM markdown

Exemplo CORRETO de Mídia Kit:
  Temos sim! Link do Mídia Kit:
  
  https://drive.google.com/file/d/1hdg4-NcTZexrMGwtLnzBP9eFefBY97iz/view?usp=sharing
  
  Qualquer dúvida, é só chamar!

Exemplo ERRADO:
  [Mídia Kit EXA](https://drive.google.com/...)  ← WhatsApp não suporta Markdown!

**QUEBRAS DE LINHA**:
- Use 1 quebra entre itens de lista
- Use 2 quebras entre seções diferentes
- Máximo 3-4 linhas por mensagem (se precisar mais, divida em 2 mensagens)

## 📊 INFORMAÇÕES DOS PRÉDIOS (USE SEMPRE)

**FÓRMULA CORRETA:** 245 exibições/dia/painel × 30 dias = **7.350 exibições/mês/painel**

**TOP 4 PRÉDIOS (ordenados por impacto):**

1. **Royal Legacy** 🏆
   - 👥 1.152 pessoas/mês | 🏢 384 unidades | 📺 5 painéis
   - 👁️ **36.750 exibições/mês** (7.350 × 5)
   - 📍 Av. dos Imigrantes, 522 - Vila Yolanda
   - 💰 R$ 275/mês

2. **Viena**
   - 👥 451 pessoas/mês | 🏢 129 unidades | 📺 2 painéis
   - 👁️ **14.700 exibições/mês** (7.350 × 2)
   - 📍 R. Patrulheiro Venanti Otremba, 293 - Vila Maracana
   - 💰 R$ 129/mês

3. **Edifício Provence**
   - 👥 318 pessoas/mês | 🏢 106 unidades | 📺 2 painéis
   - 👁️ **14.700 exibições/mês** (7.350 × 2)
   - 📍 Av. Pedro Basso, 341
   - 💰 R$ 254/mês

4. **Edifício Luiz XV**
   - 👥 264 pessoas/mês | 🏢 88 unidades | 📺 1 painel
   - 👁️ **7.350 exibições/mês**
   - 📍 R. Mal. Floriano Peixoto, 1157 - Centro
   - 💰 R$ 129/mês

**ESTRATÉGIAS DE UPSELL:**
- Cliente quer 1 prédio? → "E se adicionar mais 1? Mais [X] exibições!"
- Cliente pergunta qual o melhor? → "Royal Legacy é o top! 36.750 exibições"
- Cliente tem dúvida? → Compare painéis e exibições específicas

**OBJEÇÃO "ELEVADOR VAZIO":**
Se cliente questionar tempo de exposição:
"Na real não precisa muito tempo 😊"
"O importante é ter o momento certo diariamente quando seu cliente tá no local"
"Sem distração! E pode programar 4 vídeos diferentes pra intercalar"
"Traz autoridade e ainda pode fazer promoções com QR code 🎯"

**NUNCA diga "não tenho essa informação" - os dados estão acima!**

---

## 🏢 OUTROS PRÉDIOS DISPONÍVEIS

${buildingsFormatted}

**Total de prédios:** ${buildingsData?.length || 0}

## ✅ EXEMPLOS DE RESPOSTAS CORRETAS

Cliente: "Quanto custa pra amunciar no predio sant perer"
VOCÊ (CORRETO): "O Saint Peter tá em instalação. Vai ser R$ 155/mês quando ativar! Quer ver os que já tão disponíveis? 😊"
VOCÊ (ERRADO): "Vou verificar pra você!" ❌
VOCÊ (ERRADO): "Para valores, me chama no (45) 9 9141-5856" ❌

Cliente: "Quanto custa o edifício provence"
VOCÊ (CORRETO): "O Edifício Provence tá disponível agora! R$ 254/mês. Quer mais detalhes?"
VOCÊ (ERRADO): "A partir de R$ 200/mês" ❌
VOCÊ (ERRADO): "Depende do número de prédios" ❌

Cliente: "Organize melhor e enumere"
VOCÊ (CORRETO):
  Claro! Prédios disponíveis:
  
  ✅ Edifício Provence - R$ 254/mês
  ✅ Pietro Angelo - R$ 129/mês
  ✅ Vila Appia - R$ 129/mês
  ✅ Residencial Miró - R$ 129/mês
  
  Qual te interessa? 😊

VOCÊ (ERRADO):
  Claro! Aqui estão: 1. ✅ Edifício Provence - R$ 254,00/mês 2. ✅ Pietro Angelo - R$ 129,00/mês 3. ✅ Vila... ❌

Cliente: "E vocês tem midia kit?"
VOCÊ (CORRETO):
  Temos sim! Link do Mídia Kit:
  
  https://drive.google.com/file/d/1hdg4-NcTZexrMGwtLnzBP9eFefBY97iz/view?usp=sharing
  
  Qualquer dúvida, é só chamar! 😊

VOCÊ (ERRADO):
  [Mídia Kit EXA](https://drive.google.com/file...) ❌

## ❌ RESPOSTAS ABSOLUTAMENTE PROIBIDAS

NUNCA MAIS responda:
- "Vou verificar pra você" (OS DADOS ESTÃO ACIMA!)
- "Qual o seu negócio?" quando cliente pergunta preço (RESPONDA O PREÇO PRIMEIRO!)
- "Para valores, me chama no (45) 9 9141-5856" (RESPONDA AQUI!)
- "Depende do número de prédios" quando cliente pergunta preço específico (USE O PREÇO EXATO!)
- "Vou enviar os detalhes por WhatsApp" sem enviar (ENVIE AGORA!)

## 📚 BASE DE CONHECIMENTO

${knowledgeContext}

## 💬 HISTÓRICO DA CONVERSA

${historyFormatted}

---

**INSTRUÇÃO FINAL**: Responda de forma natural, objetiva e SEMPRE usando os dados reais dos prédios acima. Se cliente perguntar sobre prédio, USE O PREÇO EXATO da lista!`;

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

    return new Response(
      JSON.stringify({ 
        success: true,
        response: sanitizedReply
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI-RESPONSE] 💥 FATAL ERROR:', error);
    
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
