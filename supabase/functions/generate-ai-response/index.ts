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
      supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(5),
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

    // ====== CONSTRUIR HISTÓRICO ======
    const historyFormatted = conversationHistory && conversationHistory.length > 0
      ? conversationHistory.reverse().map((m: any) => 
          `${m.direction === 'inbound' ? 'Cliente' : 'Agente'}: ${m.body}`
        ).join('\n')
      : 'Início da conversa.';

    // ====== CONSTRUIR SYSTEM PROMPT COMPLETO ======
    const systemPrompt = `Você é ${agent.display_name}. ${agent.description}

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

## 🏢 DADOS REAIS DOS PRÉDIOS (SEMPRE USE ESTES DADOS!)

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
      throw new Error(`OpenAI error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const aiReply = openaiData.choices[0]?.message?.content || '';

    if (!aiReply) {
      throw new Error('Empty AI response');
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
