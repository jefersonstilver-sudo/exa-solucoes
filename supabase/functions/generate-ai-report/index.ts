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

    const { startDate, endDate, agentKey, contactType } = await req.json();

    console.log('[generate-ai-report] Generating report for period:', startDate, 'to', endDate, 'agent:', agentKey, 'type:', contactType);

    // Buscar conversas do período com filtros opcionais
    let query = supabase
      .from('conversations')
      .select(`
        id,
        contact_phone,
        agent_key,
        contact_name,
        awaiting_response,
        sentiment,
        lead_score,
        is_critical,
        is_hot_lead,
        contact_type,
        last_message_at,
        created_at,
        messages (
          id,
          body,
          direction,
          created_at,
          sentiment
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });
    
    // Aplicar filtro de agente se fornecido
    if (agentKey) {
      query = query.eq('agent_key', agentKey);
    }
    
    // Aplicar filtro de tipo de contato se fornecido
    if (contactType) {
      query = query.eq('contact_type', contactType);
    }
    
    const { data: conversations, error: convError } = await query;

    if (convError) {
      console.error('[generate-ai-report] Error fetching conversations:', convError);
      throw convError;
    }

    console.log(`[generate-ai-report] Found ${conversations?.length || 0} conversations`);

    // Preparar dados para análise da IA
    const conversationSummaries = conversations?.map(conv => ({
      id: conv.id,
      phone: conv.contact_phone,
      agent: conv.agent_key,
      contact: conv.contact_name,
      messageCount: conv.messages?.length || 0,
      awaitingResponse: conv.awaiting_response,
      sentiment: conv.sentiment,
      leadScore: conv.lead_score,
      isCritical: conv.is_critical,
      isHotLead: conv.is_hot_lead,
      contactType: conv.contact_type,
      lastMessage: conv.last_message_at,
      createdAt: conv.created_at,
    })) || [];

    const totalMessages = conversations?.reduce((sum, conv) => 
      sum + (conv.messages?.length || 0), 0) || 0;

    // Calcular métricas detalhadas para mensagens por hora e período
    const messagesByHour: Record<number, number> = {};
    const messagesByPeriod = {
      manha: { sent: 0, received: 0, contacts: new Set(), avgResponse: [] },
      tarde: { sent: 0, received: 0, contacts: new Set(), avgResponse: [] },
      noite: { sent: 0, received: 0, contacts: new Set(), avgResponse: [] }
    };

    conversations?.forEach(conv => {
      conv.messages?.forEach((msg: any) => {
        const msgDate = new Date(msg.created_at);
        const hour = msgDate.getHours();
        messagesByHour[hour] = (messagesByHour[hour] || 0) + 1;

        // Classificar por período
        let period: 'manha' | 'tarde' | 'noite';
        if (hour >= 6 && hour < 12) period = 'manha';
        else if (hour >= 12 && hour < 18) period = 'tarde';
        else period = 'noite';

        if (msg.direction === 'sent') {
          messagesByPeriod[period].sent++;
        } else {
          messagesByPeriod[period].received++;
        }
        messagesByPeriod[period].contacts.add(conv.contact_phone);
      });
    });

    // Usar IA para gerar insights profundos e detalhados
    const aiPrompt = `Você é um analista sênior especializado em CRM, vendas e atendimento ao cliente da EXA Mídia. Analise profundamente os dados de conversas do WhatsApp e gere um relatório EXECUTIVO COMPLETO E DETALHADO.

🎯 CONTEXTO DA EXA MÍDIA:
- Empresa de mídia indoor em elevadores de prédios
- Tipos de contato: Síndicos (donos de prédios), Anunciantes (clientes que compram mídia), Prestadores (técnicos de elevador), Leads (potenciais clientes), Provedores de Internet, Equipe Interna, Moradores
- Agentes: Eduardo e Sofia fazem prospecção e atendimento

⚠️ IMPORTANTE - SUGESTÃO DE TIPOS DE CONTATO:
Para contatos classificados como 'unknown' ou sem classificação, analise o contexto das mensagens e sugira um tipo apropriado:
- Se menciona elevador, manutenção, técnico → "Prestador de Serviço - Elevador"
- Se menciona internet, fibra, velocidade → "Provedor de Internet"
- Se é contato de prédio, síndico, administração → "Síndico" ou "Lead Síndico"
- Se demonstra interesse em anunciar → "Lead Anunciante"
- Se é morador comum → "Morador"
- Se é equipe interna → "Equipe Exa"

📊 DADOS DO PERÍODO:
- Total de conversas: ${conversations?.length || 0}
- Total de mensagens: ${totalMessages}
- Período: ${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}
- Mensagens por hora: ${JSON.stringify(messagesByHour)}
- Distribuição por período: ${JSON.stringify({
  manha: { sent: messagesByPeriod.manha.sent, received: messagesByPeriod.manha.received, contacts: messagesByPeriod.manha.contacts.size },
  tarde: { sent: messagesByPeriod.tarde.sent, received: messagesByPeriod.tarde.received, contacts: messagesByPeriod.tarde.contacts.size },
  noite: { sent: messagesByPeriod.noite.sent, received: messagesByPeriod.noite.received, contacts: messagesByPeriod.noite.contacts.size }
})}

💬 CONVERSAS DETALHADAS:
${JSON.stringify(conversationSummaries, null, 2)}

🎯 TAREFA - GERAR RELATÓRIO COMPLETO:
Analise PROFUNDAMENTE os dados e retorne um JSON com a estrutura EXATA abaixo. Seja ESPECÍFICO, use números reais, identifique padrões comportamentais, oportunidades e riscos.

{
  "executiveSummary": "Resumo executivo em 3-4 parágrafos com os PRINCIPAIS insights do período, destacando números, tendências e ações críticas necessárias",
  
  "journey": {
    "firstMessage": "HH:MM da primeira mensagem",
    "lastMessage": "HH:MM da última mensagem",
    "activeTime": "XXh XXmin de tempo ativo estimado",
    "breaks": "XXh XXmin de intervalos estimados"
  },

  "keyMetrics": {
    "totalContacts": ${conversations?.length || 0},
    "newConversations": 0,
    "resumedConversations": 0,
    "finishedConversations": 0,
    "totalSent": 0,
    "totalReceived": 0,
    "avgPerConversation": 0,
    "proportion": "X:X.XX",
    "avgResponseTime": "Xmin XXs",
    "fastestResponse": "XXs",
    "slowestResponse": "XXmin"
  },

  "messagesByType": [
    {
      "rank": 1,
      "icon": "emoji apropriado",
      "type": "Nome do tipo (ex: Anunciantes, Síndicos, Leads)",
      "suggestedType": "Se era 'unknown', sugerir tipo baseado no contexto (ex: Prestador de Serviço - Elevador, Provedor de Internet, Síndico, Lead Anunciante)",
      "contacts": 0,
      "sent": 0,
      "received": 0,
      "percentage": 0.0,
      "reasoning": "Breve explicação se foi sugerido novo tipo (ex: 'Mencionou manutenção de elevador')"
    }
  ],

  "periodDistribution": {
    "morning": {
      "sent": ${messagesByPeriod.manha.sent},
      "received": ${messagesByPeriod.manha.received},
      "contacts": ${messagesByPeriod.manha.contacts.size},
      "avgResponse": "Xmin XXs",
      "newConversations": 0,
      "topTypes": ["Tipo 1 com porcentagem", "Tipo 2 com porcentagem"]
    },
    "afternoon": {
      "sent": ${messagesByPeriod.tarde.sent},
      "received": ${messagesByPeriod.tarde.received},
      "contacts": ${messagesByPeriod.tarde.contacts.size},
      "avgResponse": "Xmin XXs",
      "newConversations": 0,
      "topTypes": ["Tipo 1 com porcentagem", "Tipo 2 com porcentagem"]
    },
    "evening": {
      "sent": ${messagesByPeriod.noite.sent},
      "received": ${messagesByPeriod.noite.received},
      "contacts": ${messagesByPeriod.noite.contacts.size},
      "avgResponse": "Xmin XXs",
      "newConversations": 0,
      "topTypes": ["Tipo 1 com porcentagem", "Tipo 2 com porcentagem"]
    }
  },

  "hourlyDistribution": ${JSON.stringify(messagesByHour)},

  "hotLeads": [
    {
      "name": "Nome completo do contato",
      "type": "Anunciante|Síndico|Lead",
      "score": 0,
      "phone": "número com formatação",
      "messages": 0,
      "highlight": "Principal interesse ou ação importante",
      "nextStep": "Próximo passo específico e acionável"
    }
  ],

  "behavioralAnalysis": {
    "normalPatterns": [
      "Padrão positivo observado 1",
      "Padrão positivo observado 2"
    ],
    "deviations": [
      {
        "time": "HH:MM",
        "description": "Descrição do desvio com contexto",
        "severity": "low|medium|high"
      }
    ],
    "approachErrors": [
      "Erro ou oportunidade perdida com contexto"
    ]
  },

  "dissatisfactions": {
    "prestadores": [
      {
        "name": "Nome do prestador",
        "complaint": "Descrição da reclamação",
        "severity": "high|medium|low",
        "status": "pending|in_progress|resolved",
        "recommendation": "Ação recomendada"
      }
    ],
    "anunciantes": [],
    "sindicos": []
  },

  "opportunities": {
    "seized": [
      "Oportunidade aproveitada 1 com contexto",
      "Oportunidade aproveitada 2 com contexto"
    ],
    "inProgress": [
      {
        "description": "Descrição da oportunidade",
        "nextAction": "Próxima ação específica"
      }
    ],
    "lost": [
      {
        "description": "Oportunidade perdida",
        "reason": "Razão da perda",
        "action": "Ação corretiva sugerida"
      }
    ]
  },

  "comparison": {
    "totalContacts": { "yesterday": 0, "today": 0, "variation": 0.0, "trend": "up|down|stable" },
    "messagesSent": { "yesterday": 0, "today": 0, "variation": 0.0, "trend": "up|down|stable" },
    "avgResponse": { "yesterday": "Xmin XXs", "today": "Xmin XXs", "variation": 0.0, "trend": "up|down|stable" },
    "hotLeads": { "yesterday": 0, "today": 0, "variation": 0.0, "trend": "up|down|stable" },
    "conversions": { "yesterday": 0, "today": 0, "variation": 0.0, "trend": "up|down|stable" },
    "overallTrend": "POSITIVA ↑|NEGATIVA ↓|ESTÁVEL →"
  },

  "scoreOfDay": {
    "overall": 0,
    "components": {
      "volume": { "score": 0, "weight": 20 },
      "responseTime": { "score": 0, "weight": 20 },
      "quality": { "score": 0, "weight": 25 },
      "conversions": { "score": 0, "weight": 20 },
      "satisfaction": { "score": 0, "weight": 15 }
    },
    "classification": "EXCELENTE ⭐⭐⭐⭐|BOM ⭐⭐⭐|REGULAR ⭐⭐|PRECISA MELHORAR ⭐"
  },

  "recommendations": [
    {
      "priority": "urgent|important|normal",
      "emoji": "🔴|🟡|🟢",
      "action": "Ação específica e acionável"
    }
  ]
}

⚠️ INSTRUÇÕES CRÍTICAS:
1. Use DADOS REAIS das conversas fornecidas
2. Seja ESPECÍFICO: use nomes, horários, números exatos
3. NUNCA invente dados - se não tiver informação, deixe vazio ou 0
4. Calcule métricas precisamente baseado nos dados
5. Identifique padrões REAIS de comportamento
6. Priorize OPORTUNIDADES e RISCOS concretos
7. Recomendações devem ser ACIONÁVEIS e específicas
8. Use português brasileiro profissional
9. Retorne APENAS o JSON, sem markdown ou formatação extra`;

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
      criticalConversations: conversations?.filter(c => c.is_critical).length || 0,
      hotLeads: conversations?.filter(c => c.is_hot_lead).length || 0,
      agentBreakdown: conversations?.reduce((acc: any, conv) => {
        const agent = conv.agent_key || 'unknown';
        acc[agent] = (acc[agent] || 0) + 1;
        return acc;
      }, {}),
    };

    // Buscar nome do agente se foi especificado
    let agentDisplayName = 'Sistema';
    if (agentKey) {
      const { data: agentData } = await supabase
        .from('agents')
        .select('display_name')
        .eq('key', agentKey)
        .single();
      
      if (agentData) {
        agentDisplayName = agentData.display_name;
      }
    }

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
        metrics: {
          ...metrics,
          agentKey: agentKey || 'unknown',
          messagesByType: aiInsights.messagesByType || [],
        },
        generated_by: agentDisplayName,
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
          agentKey: agentKey || 'unknown',
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
