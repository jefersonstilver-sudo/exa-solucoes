import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { startDate, endDate } = await req.json();

    console.log('[generate-ai-report] Generating report for period:', startDate, 'to', endDate);

    // Buscar conversas do período
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        phone,
        agent_key,
        contact_name,
        awaiting_response,
        last_message_at,
        created_at,
        messages (
          id,
          body,
          sender,
          created_at
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (convError) {
      console.error('[generate-ai-report] Error fetching conversations:', convError);
      throw convError;
    }

    console.log(`[generate-ai-report] Found ${conversations?.length || 0} conversations`);

    // Preparar dados para análise da IA
    const conversationSummaries = conversations?.map(conv => ({
      id: conv.id,
      phone: conv.phone,
      agent: conv.agent_key,
      contact: conv.contact_name,
      messageCount: conv.messages?.length || 0,
      awaitingResponse: conv.awaiting_response,
      lastMessage: conv.last_message_at,
      createdAt: conv.created_at,
    })) || [];

    const totalMessages = conversations?.reduce((sum, conv) => 
      sum + (conv.messages?.length || 0), 0) || 0;

    // Usar IA para gerar insights profundos
    const aiPrompt = `Você é um analista especialista em CRM e atendimento ao cliente. Analise os seguintes dados de conversas e gere um relatório executivo completo e profissional.

DADOS DO PERÍODO:
- Total de conversas: ${conversations?.length || 0}
- Total de mensagens: ${totalMessages}
- Período: ${startDate} até ${endDate}

CONVERSAS:
${JSON.stringify(conversationSummaries, null, 2)}

TAREFA:
Gere um relatório executivo detalhado em formato JSON com a seguinte estrutura:
{
  "executiveSummary": "Resumo executivo em 2-3 parágrafos destacando os principais insights",
  "keyMetrics": {
    "totalConversations": número,
    "totalMessages": número,
    "averageMessagesPerConversation": número,
    "responseRate": porcentagem,
    "pendingConversations": número
  },
  "insights": [
    {
      "title": "Título do insight",
      "description": "Descrição detalhada",
      "impact": "high|medium|low",
      "recommendation": "Recomendação acionável"
    }
  ],
  "topAgents": [
    {
      "agent": "nome do agente",
      "conversations": número,
      "performance": "descrição da performance"
    }
  ],
  "recommendations": [
    "Recomendação 1 específica e acionável",
    "Recomendação 2 específica e acionável"
  ],
  "trends": {
    "positive": ["Tendência positiva 1", "Tendência positiva 2"],
    "concerns": ["Preocupação 1", "Preocupação 2"]
  }
}

Seja específico, quantitativo e focado em insights acionáveis. Use português brasileiro.`;

    console.log('[generate-ai-report] Calling AI for analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um analista especialista em CRM e atendimento ao cliente. Sempre responda em português brasileiro com análises profundas e acionáveis.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[generate-ai-report] AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('[generate-ai-report] AI analysis completed');

    // Extrair JSON da resposta da IA
    let aiInsights;
    try {
      // Tentar encontrar JSON na resposta
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiInsights = JSON.parse(jsonMatch[0]);
      } else {
        aiInsights = { rawAnalysis: aiContent };
      }
    } catch (e) {
      console.error('[generate-ai-report] Error parsing AI response:', e);
      aiInsights = { rawAnalysis: aiContent };
    }

    // Calcular métricas básicas
    const metrics = {
      totalConversations: conversations?.length || 0,
      totalMessages,
      averageMessagesPerConv: totalMessages / (conversations?.length || 1),
      awaitingResponse: conversations?.filter(c => c.awaiting_response).length || 0,
      agentBreakdown: conversations?.reduce((acc: any, conv) => {
        const agent = conv.agent_key || 'unknown';
        acc[agent] = (acc[agent] || 0) + 1;
        return acc;
      }, {}),
    };

    // Salvar log do relatório para aprendizado contínuo
    const { error: logError } = await supabase
      .from('ai_reports_log')
      .insert({
        report_type: 'daily',
        period_start: startDate,
        period_end: endDate,
        total_conversations: conversations?.length || 0,
        total_messages: totalMessages,
        ai_insights: aiInsights,
        metrics: metrics,
        generated_by: 'system',
      });

    if (logError) {
      console.error('[generate-ai-report] Error saving log:', logError);
    }

    console.log('[generate-ai-report] Report generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          conversations: conversationSummaries,
          metrics,
          aiInsights,
          period: { start: startDate, end: endDate },
        },
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('[generate-ai-report] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
