import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper para dividir mensagens longas em chunks
function splitMessageIntoChunks(message: string, maxLength = 150): string[] {
  // Dividir por quebras de linha primeiro
  const paragraphs = message.split('\n\n').filter(p => p.trim());
  
  const chunks: string[] = [];
  
  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxLength) {
      chunks.push(paragraph.trim());
    } else {
      // Dividir parágrafo longo em sentenças
      const sentences = paragraph.split(/[.!?]\s+/);
      let currentChunk = '';
      
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length <= maxLength) {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        } else {
          if (currentChunk) chunks.push(currentChunk.trim());
          currentChunk = sentence;
        }
      }
      
      if (currentChunk) chunks.push(currentChunk.trim());
    }
  }
  
  return chunks.length > 0 ? chunks : [message]; // fallback para mensagem original
}

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

    // 1. Buscar configuração do agente
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('key', agentKey)
      .single();

    if (agentError || !agent) {
      console.error('[AI-RESPONSE] ❌ Agent not found:', agentKey, agentError);
      throw new Error('Agent not found');
    }

    console.log('[AI-RESPONSE] ✅ Agent found:', {
      key: agent.key,
      name: agent.display_name,
      aiAutoResponse: agent.ai_auto_response
    });

    // 1.1. Buscar conhecimento do agente separadamente
    const { data: agentKnowledge, error: knowledgeError } = await supabase
      .from('agent_knowledge')
      .select('*')
      .eq('agent_key', agentKey)
      .eq('is_active', true);

    if (knowledgeError) {
      console.error('[AI-RESPONSE] ⚠️ Error fetching knowledge:', knowledgeError);
    }

    console.log('[AI-RESPONSE] ✅ Knowledge items found:', agentKnowledge?.length || 0);

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
    const knowledgeContext = (agentKnowledge || [])
      .map((k: any) => `### ${k.title}\n${k.content}`)
      .join('\n\n');

    // 4. Construir histórico de mensagens
    const historyContext = (conversationHistory || [])
      .reverse()
      .map((msg: any) => 
        `${msg.direction === 'inbound' ? 'Cliente' : 'Você'}: ${msg.body}`
      )
      .join('\n');

    // 5. Montar prompt para IA usando o prompt do banco
    const baseSystemPrompt = agent.openai_config?.system_prompt || 
      `Você é ${agent.display_name}, ${agent.description}.`;

    const knowledgeSection = knowledgeContext ? 
      `\n\n## BASE DE CONHECIMENTO\n${knowledgeContext}` : '';

    const historySection = historyContext ? 
      `\n\n## HISTÓRICO DA CONVERSA\n${historyContext}` : '';

    const systemPrompt = `${baseSystemPrompt}${knowledgeSection}${historySection}

## MENSAGEM ATUAL DO CLIENTE
${message}`;

    console.log('[AI-RESPONSE] 📝 Prompt constructed:', {
      knowledgeItemsCount: (agentKnowledge || []).length,
      historyMessagesCount: (conversationHistory || []).length,
      systemPromptLength: systemPrompt.length
    });

    // 6. Enviar indicador de "digitando..." ANTES de chamar IA
    console.log('[AI-RESPONSE] ⌨️ Starting typing indicator...');
    try {
      await supabase.functions.invoke('send-typing-indicator', {
        body: {
          phone: phoneNumber,
          agentKey,
          action: 'start'
        }
      });
    } catch (typingError) {
      console.error('[AI-RESPONSE] ⚠️ Typing indicator error (non-blocking):', typingError);
    }

    // Aguardar delay realista (simular digitação humana)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 7. Chamar OpenAI via ia-console
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

    // ✅ FASE 2: ENVIAR MENSAGEM COMPLETA (SEM CHUNKS)
    console.log('[AI-RESPONSE] 📨 Sending complete message (no chunks)...', {
      messageLength: aiResponse.length,
      agentKey,
      phoneNumber
    });

    // Typing indicator antes de enviar
    try {
      await supabase.functions.invoke('send-typing-indicator', {
        body: { phone: phoneNumber, agentKey, action: 'start' }
      });
    } catch (e) {
      console.error('[AI-RESPONSE] ⚠️ Typing start error (non-blocking):', e);
    }

    // Delay realista (2-3 segundos para simular digitação humana)
    const typingDelay = 2000 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, typingDelay));

    // Parar typing indicator
    try {
      await supabase.functions.invoke('send-typing-indicator', {
        body: { phone: phoneNumber, agentKey, action: 'stop' }
      });
    } catch (e) {
      console.error('[AI-RESPONSE] ⚠️ Typing stop error (non-blocking):', e);
    }

    // Enviar mensagem COMPLETA de uma vez
    const { data: sendResult, error: sendError } = await supabase.functions.invoke('zapi-send-message', {
      body: {
        agentKey,
        phone: phoneNumber,
        message: aiResponse, // Mensagem COMPLETA, sem dividir
      }
    });

    if (sendError) {
      console.error('[AI-RESPONSE] ❌ Send error:', sendError);
      throw new Error('Failed to send message');
    }

    console.log('[AI-RESPONSE] ✅ Complete message sent successfully');

    // 10. Registrar no log
    console.log('[AI-RESPONSE] 📊 Logging event...');
    
    await supabase.from('agent_logs').insert({
      agent_key: agentKey,
      event_type: 'ai_response_sent',
      conversation_id: conversationId,
      metadata: {
        message_preview: message.substring(0, 100),
        response_preview: aiResponse.substring(0, 100),
        chunks_sent: messageChunks.length,
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
