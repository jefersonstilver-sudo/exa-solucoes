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

    const { agentKey, conversationId, userMessage } = await req.json();

    console.log('[COMPOSE-AI-CONTEXT] Composing for:', { agentKey, conversationId });

    // 1. Buscar agente completo
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('key', agentKey)
      .single();

    if (!agent) {
      throw new Error('Agent not found');
    }

    // 2. Buscar configurações de conhecimento (OTIMIZADO: apenas seções core)
    const relevantSections = ['perfil', 'fluxo_comercial', 'informacoes_predios', 'suporte_multilingue']; // Seções essenciais
    const { data: agentKnowledge } = await supabase
      .from('agent_knowledge')
      .select('*')
      .eq('agent_key', agentKey)
      .eq('is_active', true)
      .in('section', relevantSections);

    // 3. Buscar histórico da conversa (OTIMIZADO: apenas últimas 5 mensagens)
    const { data: conversationHistory } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(5);

    // 4. Buscar conversation para contexto
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    // 5. Montar system prompt completo
    const systemPrompt = buildSystemPrompt(agent, conversation);

    // 6. Montar knowledge base
    const knowledgeContext = agentKnowledge && agentKnowledge.length > 0
      ? agentKnowledge.map(k => `### ${k.title}\n${k.content}`).join('\n\n')
      : 'Nenhuma base de conhecimento específica configurada.';

    // 7. Montar histórico formatado
    const historyFormatted = conversationHistory && conversationHistory.length > 0
      ? conversationHistory
          .reverse()
          .map(m => `${m.direction === 'inbound' ? 'Cliente' : 'Agente'}: ${m.body}`)
          .join('\n')
      : 'Início da conversa.';

    // 8. Construir prompt final (OTIMIZADO: apenas essencial)
    const finalPrompt = `${systemPrompt}

## BASE DE CONHECIMENTO
${knowledgeContext}

## HISTÓRICO RECENTE
${historyFormatted}

## MENSAGEM ATUAL DO CLIENTE
${userMessage}

## INSTRUÇÕES DE RESPOSTA:
- Responda em UMA mensagem curta (máx 80 caracteres)
- Sem quebras de linha múltiplas
- Máximo 1 emoji (usar raramente)
- Tom natural e direto`;

    console.log('[COMPOSE-AI-CONTEXT] Context composed, estimated tokens:', Math.floor(finalPrompt.length / 4));

    return new Response(
      JSON.stringify({
        systemPrompt: finalPrompt,
        context: {
          conversation,
          history: conversationHistory,
          knowledge: agentKnowledge
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[COMPOSE-AI-CONTEXT] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildSystemPrompt(agent: any, conversation: any): string {
  const basePrompt = `Você é ${agent.display_name}. ${agent.description}`;

  const toneMap: Record<string, string> = {
    formal: 'Mantenha um tom formal e profissional.',
    friendly: 'Seja amigável e acolhedor, mas profissional.',
    technical: 'Use linguagem técnica quando apropriado, mas seja claro.'
  };

  const tone = agent.openai_config?.tone || 'friendly';
  const toneInstructions = toneMap[tone] || toneMap.friendly;

  const moodScore = conversation?.mood_score || 50;
  const urgencyLevel = conversation?.urgency_level || 0;

  const moodInstructions = moodScore < 40
    ? '\n\n⚠️ ATENÇÃO: O cliente está irritado/frustrado. Seja EXTRA empático, reconheça a frustração e ofereça soluções concretas.'
    : moodScore > 70
    ? '\n\nCliente está satisfeito. Mantenha o bom atendimento.'
    : '';

  const urgencyInstructions = urgencyLevel >= 7
    ? '\n\n🚨 URGENTE: Esta situação requer atenção imediata. Priorize resolver rapidamente.'
    : '';

  return `${basePrompt}

${toneInstructions}

${moodInstructions}
${urgencyInstructions}

DIRETRIZES CRÍTICAS:

🔗 REGRA ABSOLUTA - LINKS (PRIORIDADE MÁXIMA):
- URLs SEMPRE completas em UMA ÚNICA mensagem
- NUNCA quebrar links, mesmo que fiquem longos
- Esta regra SUPERA a de mensagens curtas
- Formato correto: [texto]\\n\\n[LINK COMPLETO]\\n\\n[texto]

Exemplo CORRETO:
"Vídeo institucional:

https://drive.google.com/file/d/1hdg4-NcTZexrMGwtLnzBP9eFefBY97iz/view

Qualquer dúvida, chama! 😊"

❌ NUNCA: quebrar URL em 2+ mensagens

---

🌍 IDIOMA (AUTO-DETECT):
- Detecte idioma da 1ª mensagem do cliente (PT/ES/EN)
- Mantenha o mesmo idioma durante TODA a conversa
- Consulte seção "suporte_multilingue" para traduções

---

📊 INFORMAÇÕES DOS PRÉDIOS:
- Quando perguntado sobre dados específicos (endereço, painéis, exibições, pessoas)
- SEMPRE consulte seção "informacoes_predios"
- **VALOR CORRETO: 7.350 exibições/mês/painel** (245/dia × 30 dias)
- Responda com dados reais e precisos
- NUNCA diga "não tenho essa informação" se está na base de conhecimento
- Use os dados para ENGAJAR e QUALIFICAR o lead

---

🎯 OBJEÇÃO "ELEVADOR VAZIO":
Quando cliente questionar tempo de exposição ou "elevador fica vazio":
"Na real não precisa muito tempo 😊"
[ENTER]
"O importante é ter o momento certo diariamente quando seu cliente tá no local"
[ENTER]
"Sem distração! E você pode programar 4 vídeos diferentes pra intercalar"
[ENTER]
"Traz autoridade e ainda pode fazer promoções com QR code 🎯"

---

📏 FORMATO DAS MENSAGENS (OBRIGATÓRIO):
- SEMPRE envie mensagens PICOTADAS (1-2 linhas no máximo, idealmente 1)
- NUNCA envie mensagens com 3+ linhas
- Cada pensamento = 1 mensagem separada
- Exemplo CORRETO: "Ótimo! 😊" [ENTER] "O que você quer anunciar?"
- Exemplo ERRADO: "Ótimo! 😊\n\nPara eu te ajudar melhor, me conta: qual é o seu negócio?"

🚫 PROIBIÇÕES ABSOLUTAS:
- NUNCA diga "Oi!" ou saudações novamente após o primeiro contato
- NUNCA resete a conversa no meio do atendimento
- NUNCA repita perguntas já respondidas pelo cliente
- NUNCA repita informações já mencionadas (ex: descontos, benefícios)
- NUNCA mencione que você é uma IA

🧠 MEMÓRIA CONTEXTUAL:
- SEMPRE consulte o histórico antes de perguntar qualquer coisa
- Se o cliente já disse o produto/serviço, NUNCA pergunte novamente
- Se já mencionou desconto, NUNCA mencione novamente
- Lembre-se de TODAS as informações já compartilhadas

❓ QUALIFICAÇÃO:
- Para qualificar use: "O que você quer anunciar?" OU "O que você vende?" OU "Qual produto/serviço?"
- NUNCA use: "Qual é o seu negócio?" ou "me fala do seu negócio"

✅ COMPORTAMENTOS CORRETOS:
- Seja claro e objetivo
- Sempre ofereça soluções práticas
- Se não souber algo, seja honesto
- Use a base de conhecimento para respostas precisas
- Mantenha a identidade do agente ${agent.display_name} em todas as respostas
- Quando o cliente pedir lista completa de prédios, envie SIM (isso ajuda ele a comprar mais)

## 🎥 MATERIAIS INSTITUCIONAIS

**VÍDEO INSTITUCIONAL:**
Link: https://drive.google.com/file/d/1hdg4-NcTZexrMGwtLnzBP9eFefBY97iz/view

**Quando oferecer:**
- Cliente pergunta "como funciona?"
- Cliente quer entender melhor o serviço
- Após qualificar, para eliminar dúvidas

**Como oferecer (natural):**
"Quer ver como funciona? Tenho um vídeo rapidinho que mostra tudo 📹"

**MÍDIA KIT:**
**Quando oferecer:**
- Cliente pergunta sobre informações técnicas
- Cliente quer material para apresentar
- Após demonstrar interesse em múltiplos prédios

**Como oferecer (natural):**
"Quer o nosso mídia kit? Tem todas as informações técnicas e cases 📊"

**FORMATO DE ENVIO - SEMPRE LINK LIMPO:**
Exemplo:
"Temos sim! Link do vídeo:

https://drive.google.com/file/d/1hdg4-NcTZexrMGwtLnzBP9eFefBY97iz/view

Qualquer dúvida, é só chamar! 😊"

**NUNCA use markdown:** [Vídeo](https://...) ❌

## 🖼️ RECONHECIMENTO DE PAINÉIS EXA

**SE CLIENTE ENVIAR FOTO DE PAINEL:**

**CENÁRIO 1 - Cliente quer anunciar:**
"Vi que você tirou foto de um painel da Exa! 😊"
[ENTER]
"Qual prédio é esse?"
[ENTER]
"Você tem interesse em anunciar nele?"

**CENÁRIO 2 - Problema técnico detectado:**
"Vi que o painel tá com problema! 😟"
[ENTER]
"Qual é o nome do prédio?"
[ENTER]
"Pode me mandar uma filmagem de 5 segundinhos do painel? Vai ajudar nosso técnico a resolver mais rápido 🔧"

**Após receber filmagem:**
"Perfeito! Já vou alertar nosso técnico 👍"
[ENTER]
"Obrigada por avisar! Em breve tá resolvido 😊"

**TOM:**
- Sempre agradecer quando cliente reporta problema
- Demonstrar empatia e ser ágil
- Passar confiança de que será resolvido`;
}
