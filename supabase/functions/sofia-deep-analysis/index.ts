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

    const { messageText, conversationId, agentKey = 'sofia' } = await req.json();

    console.log('[SOFIA-DEEP-ANALYSIS] Starting deep analysis:', { 
      conversationId, 
      textLength: messageText?.length 
    });

    // 1. BUSCAR TODAS AS SEÇÕES E KNOWLEDGE ITEMS DA SOFIA
    const { data: agent } = await supabase
      .from('agents')
      .select('id, key, display_name')
      .eq('key', agentKey)
      .single();

    if (!agent) {
      throw new Error('Agent not found');
    }

    const { data: sections } = await supabase
      .from('agent_sections')
      .select('*')
      .eq('agent_id', agent.id)
      .order('section_number');

    const { data: knowledgeItems } = await supabase
      .from('agent_knowledge_items')
      .select('*')
      .eq('agent_id', agent.id)
      .eq('active', true)
      .order('display_order');

    console.log('[SOFIA-DEEP-ANALYSIS] Context loaded:', {
      sections: sections?.length || 0,
      knowledgeItems: knowledgeItems?.length || 0
    });

    // 2. BUSCAR HISTÓRICO DA CONVERSA
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    console.log('[SOFIA-DEEP-ANALYSIS] Conversation history:', {
      messageCount: messages?.length || 0,
      hasContext: !!conversation
    });

    // 3. ANÁLISE PROFUNDA COM IA
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.warn('[SOFIA-DEEP-ANALYSIS] OpenAI not configured');
      return new Response(
        JSON.stringify({
          success: true,
          analysis: {
            understanding: 'Basic processing mode',
            relevantSections: [],
            relevantKnowledge: [],
            actionPlan: ['Respond with available information'],
            thinkingMessage: 'Deixa eu ver...',
            confidence: 50
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PROMPT DE ANÁLISE PROFUNDA
    const deepAnalysisPrompt = `
Você é o sistema de compreensão interna da Sofia, uma IA de vendas da EXA Mídia.

CONTEXTO DISPONÍVEL:
${sections ? `\nSEÇÕES DE CONHECIMENTO (${sections.length}):\n${sections.map(s => `- Seção ${s.section_number}: ${s.section_title}`).join('\n')}` : ''}

${knowledgeItems ? `\nITENS DE CONHECIMENTO (${knowledgeItems.length}):\n${knowledgeItems.map(k => `- ${k.title} (${k.content_type})`).join('\n')}` : ''}

${messages && messages.length > 0 ? `\nHISTÓRICO DA CONVERSA (${messages.length} mensagens):\n${messages.slice(-5).map(m => `${m.sender_type}: ${m.body}`).join('\n')}` : ''}

MENSAGEM ATUAL DO CLIENTE:
"${messageText}"

TAREFA: Analise profundamente e retorne JSON com:
{
  "understanding": "string - O que o cliente realmente quer/precisa em 1-2 frases",
  "intent": "question|budget|list|complaint|doubt|purchase",
  "complexity": 1-10,
  "relevantSections": ["números das seções relevantes"],
  "relevantKnowledge": ["titles dos knowledge items necessários"],
  "needsDatabase": boolean,
  "databaseQuery": "descrição da query se needsDatabase=true",
  "actionPlan": ["passo 1", "passo 2", "passo 3"],
  "thinkingMessage": "mensagem casual para enviar enquanto processa (ex: 'Um momentinho...', 'Deixa eu consultar aqui...', 'Já te respondo...')",
  "confidence": 0-100,
  "warnings": ["alertas ou cuidados necessários"]
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: deepAnalysisPrompt
          },
          {
            role: 'user',
            content: `Analise: "${messageText}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    const aiResult = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${aiResult.error?.message || 'Unknown error'}`);
    }

    const analysis = JSON.parse(aiResult.choices[0].message.content);

    console.log('[SOFIA-DEEP-ANALYSIS] Deep analysis complete:', {
      understanding: analysis.understanding,
      intent: analysis.intent,
      complexity: analysis.complexity,
      confidence: analysis.confidence
    });

    // 4. BUSCAR DADOS DO BANCO SE NECESSÁRIO
    let databaseData = null;
    if (analysis.needsDatabase) {
      console.log('[SOFIA-DEEP-ANALYSIS] Fetching database data...');
      
      // Buscar prédios ativos
      const { data: buildings } = await supabase
        .from('buildings')
        .select('*')
        .eq('status', 'ativo')
        .order('numero_elevadores', { ascending: false });

      databaseData = {
        buildings: buildings || [],
        totalBuildings: buildings?.length || 0,
        totalScreens: buildings?.reduce((sum, b) => sum + (b.numero_elevadores || 0), 0) || 0,
        totalViews: buildings?.reduce((sum, b) => sum + (b.visualizacoes_mes || 0), 0) || 0
      };

      console.log('[SOFIA-DEEP-ANALYSIS] Database data fetched:', {
        buildings: databaseData.totalBuildings,
        screens: databaseData.totalScreens,
        views: databaseData.totalViews
      });
    }

    // 5. SALVAR ANÁLISE NO HISTÓRICO
    await supabase
      .from('agent_logs')
      .insert({
        agent_key: agentKey,
        conversation_id: conversationId,
        event_type: 'deep_analysis',
        metadata: {
          analysis,
          databaseData,
          processingTime: Date.now()
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        databaseData,
        context: {
          sectionsAvailable: sections?.length || 0,
          knowledgeItemsAvailable: knowledgeItems?.length || 0,
          conversationLength: messages?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SOFIA-DEEP-ANALYSIS] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
