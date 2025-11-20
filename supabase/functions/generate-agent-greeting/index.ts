import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache simples em memória (5 minutos)
const greetingCache = new Map<string, { messages: any[], timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { agentKey } = await req.json();

    console.log(`[GREETING] Generating greeting for agent: ${agentKey}`);

    // Verificar cache
    const cached = greetingCache.get(agentKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('[GREETING] Returning cached greeting');
      return new Response(JSON.stringify({ messages: cached.messages }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar agente
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*, openai_config')
      .eq('key', agentKey)
      .single();

    if (agentError || !agent) {
      return new Response(JSON.stringify({ error: 'Agent not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar base de conhecimento (incluindo greeting)
    const { data: knowledge } = await supabase
      .from('agent_knowledge')
      .select('*')
      .eq('agent_key', agentKey)
      .eq('is_active', true)
      .order('section', { ascending: true });

    // Buscar seção de greeting específica
    const greetingKnowledge = knowledge?.find(k => k.section === 'greeting');

    // Se não tiver greeting customizado, retornar mensagem padrão
    if (!greetingKnowledge) {
      const defaultGreeting = getDefaultGreeting(agentKey, agent.display_name);
      const result = { messages: [defaultGreeting] };
      greetingCache.set(agentKey, { messages: [defaultGreeting], timestamp: Date.now() });
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Usar OpenAI para gerar saudação personalizada baseada no conhecimento
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      const defaultGreeting = getDefaultGreeting(agentKey, agent.display_name);
      return new Response(JSON.stringify({ messages: [defaultGreeting] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Construir prompt para geração de saudação
    // Primeiro buscar instruções da base de conhecimento
    const instructions = knowledge?.filter(k => k.section === 'instrucoes') || [];
    
    let basePrompt = '';
    if (instructions.length > 0) {
      instructions.forEach(instruction => {
        basePrompt += `${instruction.content}\n\n`;
      });
    } else {
      basePrompt = `Você é ${agent.display_name}, um agente de atendimento.\n\n`;
    }
    
    const systemPrompt = `${basePrompt}

BASE DE CONHECIMENTO - SAUDAÇÃO:
${greetingKnowledge.content}

INSTRUÇÕES:
1. Gere uma saudação inicial natural e quebrada em 2-4 mensagens curtas
2. Cada mensagem deve ter máximo 15 palavras
3. Simule comportamento de WhatsApp (mensagens quebradas)
4. Seja humano, natural e acolhedor
5. Siga EXATAMENTE o tom e regras descritas na base de conhecimento
6. Retorne APENAS um array JSON com as mensagens

Exemplo de formato esperado:
["Oi! 💛", "Sou a Sofia, da EXA", "Como posso te ajudar hoje?"]

Gere a saudação agora:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: agent.openai_config?.model || 'gpt-4o-mini',
        temperature: 0.8,
        max_tokens: 200,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Gere a saudação inicial em formato JSON array.' }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GREETING] OpenAI error:', errorText);
      
      // Parse error para detectar tipos específicos
      try {
        const errorData = JSON.parse(errorText);
        const errorCode = errorData.error?.code;
        
        if (errorCode === 'rate_limit_exceeded' || errorCode === 'insufficient_quota') {
          // Em caso de rate limit ou quota, usar saudação padrão
          const defaultGreeting = getDefaultGreeting(agentKey, agent.display_name);
          const messages = defaultGreeting.split('\n\n').filter(m => m.trim());
          return new Response(JSON.stringify({ messages }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        // Se não for JSON, continua com fallback padrão
      }
      
      const defaultGreeting = getDefaultGreeting(agentKey, agent.display_name);
      return new Response(JSON.stringify({ messages: [defaultGreeting] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    let generatedMessages: string[] = [];

    try {
      const content = data.choices[0].message.content;
      // Tentar parsear o JSON do conteúdo
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        generatedMessages = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found');
      }
    } catch (parseError) {
      console.error('[GREETING] Failed to parse OpenAI response:', parseError);
      generatedMessages = [data.choices[0].message.content];
    }

    // Cachear resultado
    greetingCache.set(agentKey, { messages: generatedMessages, timestamp: Date.now() });

    console.log(`[GREETING] Generated ${generatedMessages.length} greeting messages`);

    return new Response(JSON.stringify({ messages: generatedMessages }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[GREETING] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function getDefaultGreeting(agentKey: string, displayName: string): string {
  const greetings: Record<string, string> = {
    'sofia': `Olá! 😊\n\nSou a ${displayName}, especialista em mídia Out of Home da EXA.\n\nComo posso te ajudar hoje?`,
    'iris': `Olá.\n\nSou a ${displayName}, assistente da diretoria.\n\nComo posso auxiliá-lo?`,
    'exa_alert': `Sistema ${displayName} ativo.\n\nPronto para receber comandos.`,
    'eduardo': `Olá! 👋\n\nSou o ${displayName}, especialista em mídia Out of Home.\n\nComo posso ajudá-lo?`
  };

  return greetings[agentKey] || `Olá! Sou ${displayName}.\n\nComo posso ajudar?`;
}
