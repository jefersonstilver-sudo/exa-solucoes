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

    console.log('[AI-RESPONSE] Processing AI response for:', { agentKey, conversationId });

    // 1. Buscar configuração do agente e conhecimento
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select(`
        *,
        agent_knowledge (*)
      `)
      .eq('key', agentKey)
      .single();

    if (agentError || !agent) {
      console.error('[AI-RESPONSE] Agent not found:', agentError);
      throw new Error('Agent not found');
    }

    if (!agent.ai_auto_response) {
      console.log('[AI-RESPONSE] AI auto-response disabled for agent');
      return new Response(
        JSON.stringify({ success: false, message: 'AI auto-response disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Buscar contexto da conversa (últimas 10 mensagens)
    const { data: conversationHistory } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    // 3. Construir contexto do conhecimento
    const knowledgeContext = (agent.agent_knowledge || [])
      .filter((k: any) => k.is_active)
      .map((k: any) => `### ${k.title}\n${k.content}`)
      .join('\n\n');

    // 4. Construir histórico de mensagens
    const historyContext = (conversationHistory || [])
      .reverse()
      .map((msg: any) => 
        `${msg.direction === 'inbound' ? 'Cliente' : 'Você'}: ${msg.body}`
      )
      .join('\n');

    // 5. Montar prompt para IA
    const systemPrompt = `Você é ${agent.display_name}, ${agent.description}.

**Conhecimento Base:**
${knowledgeContext}

**Histórico da Conversa:**
${historyContext}

**Instruções:**
- Responda de forma natural e profissional
- Use o conhecimento base para responder perguntas
- Seja conciso e objetivo
- Se não souber a resposta, seja honesto
- Mantenha o tom amigável e prestativo`;

    // 6. Chamar OpenAI via ia-console
    const { data: aiResult, error: aiError } = await supabase.functions.invoke('ia-console', {
      body: {
        agentKey,
        message,
        context: {
          conversationId,
          systemPrompt,
          phone: phoneNumber
        }
      }
    });

    if (aiError) {
      console.error('[AI-RESPONSE] AI error:', aiError);
      throw new Error('Failed to generate AI response');
    }

    const aiResponse = aiResult?.response;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('[AI-RESPONSE] AI response generated:', aiResponse.substring(0, 100));

    // 7. Enviar resposta via Z-API
    const { data: sendResult, error: sendError } = await supabase.functions.invoke('zapi-send-message', {
      body: {
        agentKey,
        phone: phoneNumber,
        message: aiResponse
      }
    });

    if (sendError) {
      console.error('[AI-RESPONSE] Send error:', sendError);
      throw new Error('Failed to send response');
    }

    console.log('[AI-RESPONSE] Response sent successfully');

    // 8. Registrar no log
    await supabase.from('agent_logs').insert({
      agent_key: agentKey,
      event_type: 'ai_response_sent',
      conversation_id: conversationId,
      metadata: {
        message_preview: message.substring(0, 100),
        response_preview: aiResponse.substring(0, 100),
        success: true
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        response: aiResponse
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI-RESPONSE] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
