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

    // Training mode removed - knowledge updates now handled via Lovable chat interface

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
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: agent.openai_config?.temperature || 0.7,
        max_tokens: agent.openai_config?.max_tokens || 2000
      })
    });

    const latency = Date.now() - startTime;

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const data = await openaiResponse.json();
    const assistantMessage = data.choices[0].message.content;
    const tokensUsed = data.usage.total_tokens;

    // Registrar em logs
    await supabase.from('agent_logs').insert({
      agent_key: agentKey,
      event_type: 'console_test_success',
      metadata: {
        message: message.substring(0, 100),
        response: assistantMessage.substring(0, 200),
        tokens: tokensUsed,
        latency,
        model: data.model
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        response: assistantMessage,
        tokens: tokensUsed,
        latency,
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
