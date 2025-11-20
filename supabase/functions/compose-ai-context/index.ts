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
    const relevantSections = ['perfil', 'fluxo_comercial']; // Seções essenciais
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

DIRETRIZES:
- Seja claro e objetivo
- Nunca mencione que você é uma IA
- Sempre ofereça soluções práticas
- Se não souber algo, seja honesto
- Use a base de conhecimento para respostas precisas
- Mantenha a identidade do agente ${agent.display_name} em todas as respostas`;
}
