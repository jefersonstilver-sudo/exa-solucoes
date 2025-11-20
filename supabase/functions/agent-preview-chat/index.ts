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

    const { agentKey, messages } = await req.json();

    console.log(`[PREVIEW] Processing for agent: ${agentKey}`);

    // Buscar agente e configuração
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

    // Buscar base de conhecimento
    const { data: knowledge } = await supabase
      .from('agent_knowledge')
      .select('*')
      .eq('agent_key', agentKey)
      .eq('is_active', true)
      .order('section', { ascending: true });

    // Construir system prompt
    const systemPrompt = buildSystemPrompt(agent, knowledge || []);

    // Chamar OpenAI
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ 
        response: '⚠️ OpenAI API key não configurada. Configure em Settings → Edge Functions → Secrets' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: agent.openai_config?.model || 'gpt-4o-mini',
        temperature: agent.openai_config?.temperature || 0.7,
        max_tokens: agent.openai_config?.max_tokens || 1500,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[PREVIEW] OpenAI error:', error);
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const assistantResponse = data.choices[0].message.content;

    // Salvar histórico do preview
    await supabase.from('agent_preview_conversations').insert({
      agent_key: agentKey,
      messages: JSON.stringify([...messages, { role: 'assistant', content: assistantResponse }])
    });

    return new Response(JSON.stringify({ response: assistantResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[PREVIEW] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function buildSystemPrompt(agent: any, knowledge: any[]): string {
  let prompt = `Você é ${agent.display_name}. ${agent.description}\n\n`;
  
  if (knowledge.length > 0) {
    prompt += '## BASE DE CONHECIMENTO\n\n';
    knowledge.forEach(k => {
      prompt += `### ${k.title}\n${k.content}\n\n`;
    });
  }

  prompt += '\n\n**IMPORTANTE**: Esta é uma simulação de preview. Responda como se fosse uma conversa real no WhatsApp, de forma natural e humana.';
  
  return prompt;
}
