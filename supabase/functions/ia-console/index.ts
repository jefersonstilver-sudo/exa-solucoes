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

    const { agentKey, message, context } = await req.json();

    console.log(`[IA-CONSOLE] Processing message for agent: ${agentKey}`);

    // Carregar configuração do agente
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('key', agentKey)
      .single();

    if (agentError) throw agentError;

    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      // PLACEHOLDER: OpenAI não configurado
      await supabase.from('agent_logs').insert({
        agent_key: agentKey,
        event_type: 'console_test_pending',
        metadata: {
          message: message.substring(0, 100),
          reason: 'Missing OPENAI_API_KEY',
          status: 'pending'
        }
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: 'OpenAI API key not configured',
          response: '⚠️ Console IA requer OPENAI_API_KEY configurado no Supabase.\n\nAdicione em: Settings → Edge Functions → Secrets',
          credentialsPresent: false,
          requiredVariables: ['OPENAI_API_KEY']
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Compor contexto completo com histórico e conhecimento
    let systemPrompt = `Você é ${agent.display_name}. ${agent.description}`;
    
    // Se há conversationId, buscar contexto
    if (context?.conversationId) {
      try {
        const { data: contextData } = await supabase.functions.invoke('compose-ai-context', {
          body: {
            agentKey,
            conversationId: context.conversationId,
            userMessage: message
          }
        });
        
        if (contextData?.systemPrompt) {
          systemPrompt = contextData.systemPrompt;
          console.log('[IA-CONSOLE] Using enriched context with history and knowledge');
        }
      } catch (error) {
        console.error('[IA-CONSOLE] Failed to compose context:', error);
      }
    }

    // Construir array de mensagens com histórico
    const messagesArray = [
      { role: 'system', content: systemPrompt }
    ];

    // Adicionar histórico se existir
    if (context?.conversationHistory && Array.isArray(context.conversationHistory)) {
      console.log(`[IA-CONSOLE] Adding ${context.conversationHistory.length} messages from history`);
      messagesArray.push(...context.conversationHistory);
    }

    // Adicionar mensagem atual
    messagesArray.push({
      role: 'user',
      content: message
    });

    // Definir tools para function calling
    const tools = [
      {
        type: "function",
        function: {
          name: "consultar_predios",
          description: "Consulta dados dos prédios disponíveis na tabela buildings. Use quando o usuário perguntar sobre quantidade, preços, localizações ou disponibilidade de prédios.",
          parameters: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["ativo", "instalação", "todos"],
                description: "Filtrar por status: 'ativo' (disponíveis agora), 'instalação' (em breve), ou 'todos'"
              },
              bairro: {
                type: "string",
                description: "Opcional: filtrar por bairro específico (ex: 'Centro', 'Vila Maracana')"
              },
              tipo_consulta: {
                type: "string",
                enum: ["count", "list", "details"],
                description: "Tipo de consulta: 'count' (só quantidade), 'list' (lista resumida), 'details' (detalhes completos)"
              }
            },
            required: ["status", "tipo_consulta"]
          }
        }
      }
    ];

    // Chamar OpenAI
    const startTime = Date.now();

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: agent.openai_config?.model || 'gpt-4-turbo-preview',
        messages: messagesArray,
        tools: tools,
        temperature: agent.openai_config?.temperature || 0.7,
        max_tokens: agent.openai_config?.max_tokens || 2000
      })
    });

    const latency = Date.now() - startTime;

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const data = await openaiResponse.json();
    const assistantMessage = data.choices[0].message;

    // Se a IA pediu para chamar uma função
    if (assistantMessage.tool_calls) {
      console.log('[IA-CONSOLE] Function call requested:', assistantMessage.tool_calls[0].function.name);
      
      const toolCall = assistantMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      
      let functionResult;
      
      if (functionName === 'consultar_predios') {
        // Executar query no banco
        let query = supabase.from('buildings').select('*');
        
        // Filtrar por status
        if (functionArgs.status === 'ativo') {
          query = query.eq('status', 'ativo');
        } else if (functionArgs.status === 'instalação') {
          query = query.eq('status', 'instalação');
        }
        
        // Filtrar por bairro se especificado
        if (functionArgs.bairro) {
          query = query.ilike('bairro', `%${functionArgs.bairro}%`);
        }
        
        const { data: buildings, error: buildingsError } = await query;
        
        if (buildingsError) {
          functionResult = { error: buildingsError.message };
        } else {
          // Formatar resultado baseado no tipo de consulta
          if (functionArgs.tipo_consulta === 'count') {
            functionResult = {
              total: buildings.length,
              status: functionArgs.status
            };
          } else if (functionArgs.tipo_consulta === 'list') {
            functionResult = buildings.map(b => ({
              nome: b.nome,
              bairro: b.bairro,
              preco_base: b.preco_base,
              status: b.status
            }));
          } else {
            functionResult = buildings;
          }
        }
        
        console.log(`[IA-CONSOLE] Query result: ${buildings?.length || 0} buildings found`);
      }
      
      // Chamar OpenAI novamente com o resultado da função
      const secondCallResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: agent.openai_config?.model || 'gpt-4-turbo-preview',
          messages: [
            ...messagesArray,
            assistantMessage,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(functionResult)
            }
          ],
          temperature: agent.openai_config?.temperature || 0.7,
          max_tokens: agent.openai_config?.max_tokens || 2000
        })
      });
      
      const finalData = await secondCallResponse.json();
      const finalMessage = finalData.choices[0].message.content;
      const tokensUsed = finalData.usage.total_tokens;
      
      // Registrar em logs
      await supabase.from('agent_logs').insert({
        agent_key: agentKey,
        event_type: 'console_test_success',
        metadata: {
          message: message.substring(0, 100),
          response: finalMessage.substring(0, 200),
          tokens: tokensUsed,
          latency: Date.now() - startTime,
          model: finalData.model,
          function_called: functionName
        }
      });
      
      return new Response(
        JSON.stringify({
          success: true,
          response: finalMessage,
          tokens: tokensUsed,
          latency: Date.now() - startTime,
          model: finalData.model,
          credentialsPresent: true,
          functionCalled: functionName,
          functionResult: functionResult
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Se não houve function call, retornar resposta normalmente
    const finalMessage = assistantMessage.content;
    const tokensUsed = data.usage.total_tokens;

    // Registrar em logs (resposta sem function call)
    await supabase.from('agent_logs').insert({
      agent_key: agentKey,
      event_type: 'console_test_success',
      metadata: {
        message: message.substring(0, 100),
        response: finalMessage.substring(0, 200),
        tokens: tokensUsed,
        latency: Date.now() - startTime,
        model: data.model
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        response: finalMessage,
        tokens: tokensUsed,
        latency: Date.now() - startTime,
        model: data.model,
        credentialsPresent: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[IA-CONSOLE] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        response: `Erro ao processar: ${error.message}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
