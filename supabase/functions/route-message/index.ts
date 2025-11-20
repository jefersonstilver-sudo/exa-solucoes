import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoutingRule {
  name: string;
  priority: number;
  match: {
    contains?: string[];
    any_of?: string[];
    score_threshold?: number;
    tags?: string[];
  };
  target: string;
  actions: string[];
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

    const { message, conversationId, metadata } = await req.json();
    
    console.log(`[ROUTE] Processing message: ${message.substring(0, 50)}...`);

    // ETAPA 1: Analisar mensagem com IA
    let analysis = null;
    try {
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-message', {
        body: { conversationId, messageText: message, metadata }
      });

      if (!analysisError && analysisData) {
        analysis = analysisData.analysis;
        console.log('[ROUTE] Message analyzed:', {
          sentiment: analysis.sentiment,
          lead_score: analysis.lead_score,
          urgency: analysis.urgency_level,
          is_critical: analysis.is_critical
        });
      }
    } catch (error) {
      console.error('[ROUTE] Analysis error:', error);
    }

    // 1. Buscar todos os agentes ativos
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true);

    if (agentsError) throw agentsError;

    let selectedAgent = null;
    let matchedRule = null;

    // 2. Executar motor de roteamento
    for (const agent of agents || []) {
      const rules: RoutingRule[] = agent.routing_rules || [];
      
      for (const rule of rules.sort((a, b) => b.priority - a.priority)) {
        let isMatch = false;

        // Match por palavras-chave (contains ou any_of)
        const keywords = rule.match.contains || rule.match.any_of || [];
        if (keywords.length > 0) {
          const messageLower = message.toLowerCase();
          isMatch = keywords.some(keyword => 
            messageLower.includes(keyword.toLowerCase())
          );
        }

        // Match por score (se aplicável)
        if (rule.match.score_threshold && metadata?.qualification_score) {
          isMatch = metadata.qualification_score >= rule.match.score_threshold;
        }

        // Match por tags (se aplicável)
        if (rule.match.tags && metadata?.tags) {
          isMatch = rule.match.tags.some(tag => metadata.tags.includes(tag));
        }

        if (isMatch) {
          selectedAgent = agent;
          matchedRule = rule;
          break;
        }
      }

      if (selectedAgent) break;
    }

    // 3. Se nenhuma regra matched, usar agente padrão (sofia)
    if (!selectedAgent) {
      selectedAgent = (agents || []).find(a => a.key === 'sofia') || agents?.[0];
      matchedRule = { name: 'default_fallback', actions: [] };
    }

    console.log(`[ROUTE] Routed to agent: ${selectedAgent?.key} via rule: ${matchedRule?.name}`);

    // ETAPA 2: Orquestração automática baseada em análise
    if (analysis) {
      const { lead_score, is_critical, is_sindico, sentiment, mood_score, urgency_level } = analysis;

      // REGRA: Leads quentes (score >= 75) → Escalar para Eduardo
      if (lead_score >= 75 && !metadata?.escalated_to_eduardo) {
        await escalateToEduardo(supabase, conversationId, message, analysis, agents || []);
      }

      // REGRA: Clientes/síndicos irritados → Notificar IRIS
      if ((sentiment === 'angry' || mood_score < 30) && (is_sindico || is_critical)) {
        await notifyIRIS(supabase, conversationId, message, { sentiment, mood_score, is_sindico });
      }

      // REGRA: Urgência alta → Alertar EXA Alert
      if (urgency_level >= 8 || is_critical) {
        await alertEXA(supabase, conversationId, message, { urgency_level, is_critical });
      }

      // REGRA: Cliente esperando > 30 min → Alertar EXA Alert
      await checkResponseTime(supabase, conversationId);
    }

    // 4. Registrar log
    await supabase.from('agent_logs').insert({
      agent_key: selectedAgent.key,
      event_type: 'routed_to_agent',
      conversation_id: conversationId,
      rule_used: matchedRule.name,
      metadata: {
        message_preview: message.substring(0, 100),
        matched_keywords: matchedRule.match?.contains || matchedRule.match?.any_of || []
      }
    });

    // 5. Executar ações da regra
    for (const action of matchedRule.actions || []) {
      switch (action) {
        case 'create_alert':
          await createDeviceAlert(supabase, message, metadata);
          break;
        case 'notify_directors':
          await notifyDirectors(supabase, selectedAgent, message);
          break;
        case 'notify_whatsapp':
          await notifyWhatsApp(supabase, selectedAgent, message, metadata);
          break;
        case 'notify_if_hot':
          if (metadata?.qualification_score >= 75) {
            const eduardo = (agents || []).find(a => a.key === 'eduardo');
            if (eduardo) {
              await notifyWhatsApp(supabase, eduardo, message, metadata);
            }
          }
          break;
        case 'assign':
          console.log(`[ACTION] Assigning conversation ${conversationId} to ${selectedAgent.key}`);
          break;
        case 'provide_bi':
          console.log(`[ACTION] Providing BI data for ${selectedAgent.key}`);
          break;
      }
    }

    // 6. Se a mensagem veio de um agente Z-API, processar com IA e retornar resposta
    let aiResponse = null;
    if (metadata?.source === 'zapi' && selectedAgent.whatsapp_provider === 'zapi') {
      console.log('[ROUTE] Processing Z-API message with AI...');
      
      try {
        const { data: aiResult, error: aiError } = await supabase.functions.invoke('ia-console', {
          body: {
            agentKey: selectedAgent.key,
            message: message,
            context: {
              conversationId,
              source: 'zapi',
              phone: metadata.phone
            }
          }
        });

        if (aiError) {
          console.error('[ROUTE] AI error:', aiError);
        } else {
          aiResponse = aiResult?.response;
          console.log('[ROUTE] AI response generated:', aiResponse?.substring(0, 100));
        }
      } catch (error) {
        console.error('[ROUTE] Failed to get AI response:', error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        routed_to: selectedAgent.key,
        rule_used: matchedRule.name,
        actions_executed: matchedRule.actions,
        response: aiResponse // Incluir resposta da IA se disponível
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[ROUTE] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// ============================================================================
// FUNÇÕES AUXILIARES COM PLACEHOLDERS SEGUROS
// ============================================================================

async function createDeviceAlert(supabase: any, message: string, metadata: any) {
  console.log('[ACTION] Creating device alert...');
  
  // Criar alerta no DB (funcional)
  await supabase.from('agent_logs').insert({
    agent_key: 'exa_alert',
    event_type: 'device_alert_created',
    metadata: {
      message: message.substring(0, 200),
      severity: 'high',
      created_at: new Date().toISOString()
    }
  });
}

async function notifyDirectors(supabase: any, agent: any, message: string) {
  console.log('[ACTION] Notifying directors...');
  
  // PLACEHOLDER: Requer configuração de diretores no sistema
  // Por enquanto, criar log de notificação pendente
  await supabase.from('agent_logs').insert({
    agent_key: agent.key,
    event_type: 'director_notification_pending',
    metadata: {
      message: message.substring(0, 200),
      reason: 'Directors notification system not configured',
      status: 'pending'
    }
  });
}

async function notifyWhatsApp(supabase: any, agent: any, message: string, metadata: any) {
  console.log(`[ACTION] Sending WhatsApp notification via ${agent.whatsapp_provider}...`);
  
  const provider = agent.whatsapp_provider;
  const targetPhone = metadata?.phone || agent.whatsapp_number;

  if (!targetPhone) {
    console.error('[NOTIFY] No target phone number found');
    return;
  }

  try {
    if (provider === 'zapi') {
      await supabase.functions.invoke('zapi-send-message', {
        body: {
          agentKey: agent.key,
          phone: targetPhone,
          message: message
        }
      });
      console.log('[NOTIFY] Z-API notification sent successfully');

    } else if (provider === 'manychat') {
      await supabase.from('agent_logs').insert({
        agent_key: agent.key,
        event_type: 'manychat_notification_pending',
        metadata: {
          message: message.substring(0, 200),
          target_number: targetPhone,
          reason: 'ManyChat API not yet configured',
          status: 'pending'
        }
      });
    }
  } catch (error) {
    console.error('[NOTIFY] Failed to send WhatsApp notification:', error);
    await supabase.from('agent_logs').insert({
      agent_key: agent.key,
      event_type: 'whatsapp_notification_failed',
      metadata: {
        message: message.substring(0, 200),
        target_number: targetPhone,
        provider,
        error: error.message
      }
    });
  }
}

// Funções de orquestração
async function escalateToEduardo(supabase: any, conversationId: string, message: string, analysis: any, agents: any[]) {
  await supabase
    .from('conversations')
    .update({
      escalated_to_eduardo: true,
      escalated_at: new Date().toISOString()
    })
    .eq('id', conversationId);
  
  await supabase.from('conversation_events').insert({
    conversation_id: conversationId,
    event_type: 'escalated',
    from_agent: 'sofia',
    to_agent: 'eduardo',
    severity: 'warning',
    details: {
      reason: 'lead_score >= 75',
      message_preview: message.substring(0, 100),
      lead_score: analysis.lead_score
    }
  });
  
  const eduardo = agents.find((a: any) => a.key === 'eduardo');
  if (eduardo && eduardo.whatsapp_number) {
    const notificationMessage = `🔥 LEAD QUENTE DETECTADO!\n\nScore: ${analysis.lead_score}/100\n\nMensagem: ${message.substring(0, 200)}...\n\n👉 Responda rapidamente!`;
    
    await supabase.functions.invoke('send-message-unified', {
      body: {
        conversationId,
        agentKey: 'exa_alert',
        message: notificationMessage
      }
    });
  }
  
  console.log('[ESCALATE] Lead quente escalado para Eduardo');
}

async function notifyIRIS(supabase: any, conversationId: string, message: string, context: any) {
  await supabase
    .from('conversations')
    .update({ reported_to_iris: true })
    .eq('id', conversationId);
  
  await supabase.from('conversation_events').insert({
    conversation_id: conversationId,
    event_type: 'reported',
    from_agent: 'sofia',
    to_agent: 'iris',
    severity: 'critical',
    details: {
      reason: context.is_sindico ? 'sindico_irritado' : 'cliente_irritado',
      sentiment: context.sentiment,
      mood_score: context.mood_score,
      message_preview: message.substring(0, 200)
    }
  });
  
  console.log('[NOTIFY_IRIS] Conversa crítica reportada à IRIS');
}

async function alertEXA(supabase: any, conversationId: string, message: string, context: any) {
  await supabase
    .from('conversations')
    .update({ alerted_exa: true })
    .eq('id', conversationId);
  
  await supabase.from('conversation_events').insert({
    conversation_id: conversationId,
    event_type: 'alerted',
    to_agent: 'exa_alert',
    severity: 'critical',
    details: {
      reason: context.is_critical ? 'situacao_critica' : 'urgencia_alta',
      urgency_level: context.urgency_level,
      message_preview: message.substring(0, 200)
    }
  });
  
  const alertMessage = `⚠️ ALERTA CRÍTICO!\n\nUrgência: ${context.urgency_level}/10\n\nMensagem: ${message.substring(0, 200)}...\n\n👉 Ação imediata necessária!`;
  
  const { data: directors } = await supabase
    .from('iris_authorized_directors')
    .select('phone_number')
    .eq('receive_alerts', true);
  
  for (const director of directors || []) {
    await supabase.functions.invoke('zapi-send-message', {
      body: {
        agentKey: 'exa_alert',
        phone: director.phone_number,
        message: alertMessage
      }
    });
  }
  
  console.log('[ALERT_EXA] Alerta crítico enviado');
}

async function checkResponseTime(supabase: any, conversationId: string) {
  const { data: conversation } = await supabase
    .from('conversations')
    .select('last_message_at, awaiting_response, agent_key')
    .eq('id', conversationId)
    .single();
  
  if (!conversation || !conversation.awaiting_response) return;
  
  const waitingTime = Date.now() - new Date(conversation.last_message_at).getTime();
  const waitingMinutes = waitingTime / 1000 / 60;
  
  if (waitingMinutes > 30) {
    await supabase.from('conversation_events').insert({
      conversation_id: conversationId,
      event_type: 'alerted',
      to_agent: 'exa_alert',
      severity: 'warning',
      details: {
        reason: 'cliente_aguardando',
        waiting_minutes: Math.floor(waitingMinutes),
        agent_responsible: conversation.agent_key
      }
    });
    
    console.log(`[CHECK_TIME] Cliente esperando há ${Math.floor(waitingMinutes)} minutos`);
  }
}
