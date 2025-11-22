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

    // 1. Paralelizar queries (5→1 call = mais rápido) + dados reais
    const [
      { data: agent, error: agentError },
      { data: agentKnowledge, error: knowledgeError },
      { data: conversationHistory },
      { data: conversation },
      { data: buildingsData, error: buildingsError }
    ] = await Promise.all([
      supabase.from('agents').select('*').eq('key', agentKey).single(),
      supabase.from('agent_knowledge').select('*').eq('agent_key', agentKey).eq('is_active', true).in('section', ['perfil', 'fluxo_comercial', 'regras_basicas']),
      supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(5),
      supabase.from('conversations').select('provider').eq('id', conversationId).single(),
      supabase.from('buildings').select('nome, codigo_predio, preco_base, quantidade_telas, publico_estimado, bairro, status').in('status', ['ativo', 'instalação']).limit(50)
    ]);

    console.log('[AI-RESPONSE] 🏢 Buildings query result:', {
      count: buildingsData?.length || 0,
      hasError: !!buildingsError,
      error: buildingsError,
      buildings: buildingsData?.map(b => ({
        nome: b.nome,
        status: b.status,
        preco: b.preco_base
      })) || []
    });

    if (agentError || !agent) {
      console.error('[AI-RESPONSE] ❌ Agent not found:', agentKey, agentError);
      throw new Error('Agent not found');
    }

    console.log('[AI-RESPONSE] ✅ Data loaded:', {
      agent: agent.display_name,
      knowledge: agentKnowledge?.length || 0,
      history: conversationHistory?.length || 0,
      provider: conversation?.provider,
      realBuildings: buildingsData?.length || 0
    });

    if (!agent.ai_auto_response) {
      console.log('[AI-RESPONSE] ⏸️ AI auto-response disabled');
      return new Response(
        JSON.stringify({ success: false, message: 'AI auto-response disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Construir contexto do conhecimento
    const knowledgeContext = (agentKnowledge || [])
      .map((k: any) => `### ${k.title}\n${k.content}`)
      .join('\n\n');

    // 3.5. Injetar dados REAIS dos prédios (anti-alucinação)
    const realDataSection = buildingsData && buildingsData.length > 0 ? `

## 🏢 DADOS REAIS DA LOJA (SEMPRE USE ESTES DADOS - ATUALIZADO EM TEMPO REAL)

⚠️ ATENÇÃO: NUNCA invente números de prédios, preços ou público. Use APENAS os dados abaixo.

**Total de prédios disponíveis:** ${buildingsData.length}

**Lista completa de prédios disponíveis para venda:**
${buildingsData.map((b: any) => {
  const statusEmoji = b.status === 'ativo' ? '✅ DISPONÍVEL' : '🚧 EM INSTALAÇÃO';
  return `- ${b.nome} (${statusEmoji}) - Código: ${b.codigo_predio || 'N/A'} - Bairro: ${b.bairro}
   Preço: R$ ${b.preco_base ? b.preco_base.toFixed(2) : 'Consultar'}/mês | Telas: ${b.quantidade_telas || 0} | Público estimado: ${b.publico_estimado ? b.publico_estimado.toLocaleString() : 'N/A'} pessoas/mês`;
}).join('\n')}

⚠️ VALIDAÇÃO OBRIGATÓRIA PRÉ-RESPOSTA:

QUANDO O CLIENTE PERGUNTAR SOBRE PRÉDIO ESPECÍFICO:
1. PROCURE na lista acima usando fuzzy match
   - "sant peter" = "Saint Peter"
   - "san pedro" = "Saint Peter"  
   - Ignore acentos, maiúsculas, pontuação
   
2. SE ENCONTRAR:
   ✅ Use o nome EXATO da lista
   ✅ Use o preço EXATO sem arredondar
   ✅ Informe status:
      - ativo → "Esse prédio tá disponível agora!"
      - instalação → "Esse prédio tá em fase de instalação. Quando ativar, vai ser R$ [preço exato]/mês"
   
3. SE NÃO ENCONTRAR:
   Responda: "Opa, esse prédio não tá na nossa base ainda não viu... Mas posso te mostrar os que a gente tem disponíveis!"

4. ❌ PROIBIÇÕES ABSOLUTAS:
   - NUNCA invente preços
   - NUNCA diga "só trato de publicidade em elevadores" (VOCÊ TRATA DE PRÉDIOS!)
   - NUNCA use "a partir de..." quando cliente perguntar prédio específico
   - NUNCA diga "vou verificar" quando os dados já estão no contexto
` : '';

    console.log('[AI-RESPONSE] 📊 Real data injected:', {
      buildingsCount: buildingsData?.length || 0,
      realDataLength: realDataSection.length
    });

    // 4. Construir histórico de mensagens incluindo descrições de imagens
    const historyContext = (conversationHistory || [])
      .reverse()
      .map((msg: any) => {
        const sender = msg.direction === 'inbound' ? 'Cliente' : 'Você';
        let messageContent = msg.body;
        
        // Se mensagem inclui descrição de imagem da visão AI, mantê-la
        // (já vem processada do zapi-webhook)
        
        return `${sender}: ${messageContent}`;
      })
      .join('\n');

    // 5. Montar prompt para IA usando o prompt do banco
    const baseSystemPrompt = agent.openai_config?.system_prompt || 
      `Você é ${agent.display_name}, ${agent.description}.`;

    const knowledgeSection = knowledgeContext ? 
      `\n\n## BASE DE CONHECIMENTO\n${knowledgeContext}` : '';

    const historySection = historyContext ? 
      `\n\n## HISTÓRICO DA CONVERSA\n${historyContext}` : '';

    const systemPrompt = `${baseSystemPrompt}${realDataSection}${knowledgeSection}${historySection}

## MENSAGEM ATUAL DO CLIENTE
${message}`;

    console.log('[AI-RESPONSE] 📝 Prompt constructed:', {
      knowledgeItemsCount: (agentKnowledge || []).length,
      historyMessagesCount: (conversationHistory || []).length,
      systemPromptLength: systemPrompt.length
    });

    // 6. Typing indicator (1x, Z-API para automaticamente ao enviar)
    console.log('[AI-RESPONSE] ⌨️ Typing indicator...');
    supabase.functions.invoke('send-typing-indicator', {
      body: { phone: phoneNumber, agentKey, action: 'start' }
    }).catch(e => console.error('[AI-RESPONSE] ⚠️ Typing error (non-blocking):', e));

    // 7. Fuzzy matching - detectar menção de prédio
    const normalizeName = (text: string) => {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s]/g, '') // Remove pontuação
        .replace(/\s+/g, ' ') // Remove espaços extras
        .trim();
    };

    const userNormalized = normalizeName(message);
    const buildingMentioned = buildingsData?.find((b: any) => {
      const bNormalized = normalizeName(b.nome);
      
      // Match exato
      if (userNormalized.includes(bNormalized)) return true;
      
      // Match parcial (pelo menos 70% das palavras)
      const userWords = userNormalized.split(' ');
      const buildingWords = bNormalized.split(' ');
      const matchCount = buildingWords.filter(word => 
        userWords.some(uWord => uWord.includes(word) || word.includes(uWord))
      ).length;
      
      return matchCount / buildingWords.length >= 0.7;
    });

    // 7.5 Log context preview e fuzzy match result
    console.log('[AI-RESPONSE] 🔍 PRE-VALIDATION COMPLETE:', {
      // Input
      userMessage: message.substring(0, 100),
      userNormalized: userNormalized,
      
      // Detection
      buildingDetected: buildingMentioned?.nome || 'NONE',
      detectionConfidence: buildingMentioned ? 'HIGH' : 'NONE',
      
      // Data available
      buildingPrice: buildingMentioned?.preco_base || 'n/a',
      buildingStatus: buildingMentioned?.status || 'n/a',
      totalBuildingsAvailable: buildingsData?.length || 0,
      
      // Context injection
      willInjectSpecificBuilding: !!buildingMentioned,
      contextSize: systemPrompt.length,
      buildingsPreview: buildingsData?.map(b => `${b.nome} (${b.status})`).slice(0, 5) || []
    });

    // 8. Chamar OpenAI via ia-console
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

    let aiResponse = aiResult?.response;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // SANITIZAÇÃO: Remover quebras de linha múltiplas e forçar mensagem única
    aiResponse = aiResponse
      .replace(/\n\n+/g, ' ')  // Substituir quebras duplas por espaço
      .replace(/\n/g, ' ')     // Substituir quebras simples por espaço
      .trim();

    console.log('[AI-RESPONSE] ✅ AI response generated and sanitized:', {
      responseLength: aiResponse.length,
      responsePreview: aiResponse.substring(0, 100)
    });

    // 8. Enviar mensagem (typing para automaticamente)
    console.log('[AI-RESPONSE] 📨 Sending message via', conversation?.provider);

    // Enviar via provider apropriado
    let sendResult, sendError;
    if (conversation?.provider === 'manychat') {
      // Usar send-message-unified para ManyChat
      const result = await supabase.functions.invoke('send-message-unified', {
        body: {
          conversationId,
          agentKey,
          message: aiResponse
        }
      });
      sendResult = result.data;
      sendError = result.error;
    } else {
      // Usar zapi-send-message para WhatsApp/Z-API
      const result = await supabase.functions.invoke('zapi-send-message', {
        body: {
          agentKey,
          phone: phoneNumber,
          message: aiResponse
        }
      });
      sendResult = result.data;
      sendError = result.error;
    }

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
        chunks_sent: 1, // ✅ CORRIGIDO: sempre 1 mensagem completa agora
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
