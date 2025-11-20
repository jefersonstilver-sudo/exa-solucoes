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
      console.error('[AI-RESPONSE] ❌ Agent not found:', agentKey, agentError);
      throw new Error('Agent not found');
    }

    console.log('[AI-RESPONSE] ✅ Agent found:', {
      key: agent.key,
      name: agent.display_name,
      aiAutoResponse: agent.ai_auto_response,
      hasKnowledge: !!agent.agent_knowledge?.length
    });

    if (!agent.ai_auto_response) {
      console.log('[AI-RESPONSE] ⏸️ AI auto-response disabled for agent');
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

    console.log('[AI-RESPONSE] 📝 Prompt constructed:', {
      knowledgeItemsCount: (agent.agent_knowledge || []).filter((k: any) => k.is_active).length,
      historyMessagesCount: (conversationHistory || []).length,
      systemPromptLength: systemPrompt.length
    });

    // 6. Chamar OpenAI via ia-console
    console.log('[AI-RESPONSE] 🧠 Calling ia-console...');
    
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
      console.error('[AI-RESPONSE] ❌ AI error:', aiError);
      throw new Error('Failed to generate AI response');
    }

    const aiResponse = aiResult?.response;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('[AI-RESPONSE] ✅ AI response generated:', {
      responseLength: aiResponse.length,
      responsePreview: aiResponse.substring(0, 100)
    });

    // 7. Enviar resposta via Z-API
    console.log('[AI-RESPONSE] 📤 Sending response via WhatsApp...');
    
    const { data: sendResult, error: sendError } = await supabase.functions.invoke('zapi-send-message', {
      body: {
        agentKey,
        phone: phoneNumber,
        message: aiResponse
      }
    });

    if (sendError) {
      console.error('[AI-RESPONSE] ❌ Send error:', sendError);
      throw new Error('Failed to send response');
    }

    console.log('[AI-RESPONSE] ✅ Message sent successfully:', {
      messageId: sendResult?.messageId,
      phone: phoneNumber
    });

    // 8. Registrar no log
    console.log('[AI-RESPONSE] 📊 Logging event...');
    
    await supabase.from('agent_logs').insert({
      agent_key: agentKey,
      event_type: 'ai_response_sent',
      conversation_id: conversationId,
      metadata: {
        message_preview: message.substring(0, 100),
        response_preview: aiResponse.substring(0, 100),
        success: true,
        timestamp: new Date().toISOString()
      }
    });

    console.log('[AI-RESPONSE] 🎉 Complete! AI response flow finished successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        response: aiResponse
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI-RESPONSE] 💥 FATAL ERROR:', error);
    console.error('[AI-RESPONSE] Error stack:', error.stack);
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
