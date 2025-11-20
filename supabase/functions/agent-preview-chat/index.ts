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

    // Se for Sofia, adicionar ferramenta de consulta de prédios
    const tools = agentKey === 'sofia' ? [
      {
        type: 'function',
        function: {
          name: 'consultar_predios',
          description: 'Consulta a lista de prédios disponíveis na EXA. Use quando o cliente perguntar sobre prédios, localização, bairros ou quiser ver opções disponíveis.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Nome do prédio ou termo de busca (opcional)'
              },
              bairro: {
                type: 'string',
                description: 'Filtrar por bairro específico (opcional)'
              }
            }
          }
        }
      }
    ] : undefined;

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
        ],
        tools: tools,
        tool_choice: tools ? 'auto' : undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PREVIEW] OpenAI error:', errorText);
      
      // Parse error para detectar tipos específicos
      try {
        const errorData = JSON.parse(errorText);
        const errorCode = errorData.error?.code;
        
        if (errorCode === 'rate_limit_exceeded') {
          return new Response(JSON.stringify({ 
            response: '⏰ Aguarde um momento... Limite de requisições atingido. Tente novamente em alguns segundos.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        if (errorCode === 'insufficient_quota') {
          return new Response(JSON.stringify({ 
            response: '⚠️ Créditos do OpenAI esgotados. Configure uma nova API key em Settings → Edge Functions → Secrets (OPENAI_API_KEY)' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        // Se não for JSON, continua com erro genérico
      }
      
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // Se a IA decidiu usar a ferramenta, executar
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      
      if (toolCall.function.name === 'consultar_predios') {
        console.log('[PREVIEW] Consultando prédios...');
        const args = JSON.parse(toolCall.function.arguments);
        
        // Chamar edge function de prédios
        const { data: buildingsData, error: buildingsError } = await supabase.functions.invoke('get-buildings-for-agent', {
          body: {
            query: args.query,
            filters: { bairro: args.bairro }
          }
        });
        
        if (buildingsError) {
          console.error('[PREVIEW] Error fetching buildings:', buildingsError);
        }
        
        // Adicionar resultado ao contexto e pedir resposta final
        const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              ...messages,
              assistantMessage,
              {
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(buildingsData || { buildings: [], total: 0 })
              }
            ]
          })
        });
        
        if (!finalResponse.ok) {
          const errorText = await finalResponse.text();
          console.error('[PREVIEW] OpenAI error on final response:', errorText);
          
          // Parse error para detectar tipos específicos
          try {
            const errorData = JSON.parse(errorText);
            const errorCode = errorData.error?.code;
            
            if (errorCode === 'rate_limit_exceeded') {
              return new Response(JSON.stringify({ 
                response: '⏰ Aguarde um momento... Limite de requisições atingido. Tente novamente em alguns segundos.' 
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
            
            if (errorCode === 'insufficient_quota') {
              return new Response(JSON.stringify({ 
                response: '⚠️ Créditos do OpenAI esgotados. Configure uma nova API key em Settings → Edge Functions → Secrets (OPENAI_API_KEY)' 
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
          } catch (e) {
            // Se não for JSON, continua com erro genérico
          }
          
          throw new Error('OpenAI API error');
        }
        
        const finalData = await finalResponse.json();
        const assistantResponse = finalData.choices[0].message.content;

        // Salvar histórico do preview
        await supabase.from('agent_preview_conversations').insert({
          agent_key: agentKey,
          messages: JSON.stringify([...messages, { role: 'assistant', content: assistantResponse }])
        });

        return new Response(JSON.stringify({ response: assistantResponse }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Resposta normal sem tool calling
    const assistantResponse = assistantMessage.content;

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
  // Separar instruções da base de conhecimento
  const instructions = knowledge.filter(k => k.section === 'instrucoes');
  const otherKnowledge = knowledge.filter(k => k.section !== 'instrucoes');
  
  let prompt = '';
  
  // Construir prompt a partir das instruções
  if (instructions.length > 0) {
    instructions.forEach(instruction => {
      prompt += `${instruction.content}\n\n`;
    });
  } else {
    // Fallback se não houver instruções
    prompt = `Você é ${agent.display_name}. ${agent.description}\n\n`;
  }
  
  // Adicionar resto da base de conhecimento
  if (otherKnowledge.length > 0) {
    prompt += '## BASE DE CONHECIMENTO ADICIONAL\n\n';
    otherKnowledge.forEach(k => {
      prompt += `### ${k.title}\n${k.content}\n\n`;
    });
  }

  prompt += '\n\n**IMPORTANTE**: Esta é uma simulação de preview. Responda como se fosse uma conversa real no WhatsApp, de forma natural e humana.';
  
  return prompt;
}
