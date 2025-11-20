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

    return new Response(
      JSON.stringify({ 
        success: true,
        routed_to: selectedAgent.key,
        rule_used: matchedRule.name,
        actions_executed: matchedRule.actions
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
  const whatsappKey = Deno.env.get('WHATSAPP_API_KEY');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  
  if (!whatsappKey || !phoneNumberId) {
    console.log('[PLACEHOLDER] WhatsApp notification pending - missing credentials');
    console.log('[PLACEHOLDER] Required: WHATSAPP_API_KEY, WHATSAPP_PHONE_NUMBER_ID');
    
    // Criar notificação pendente no DB
    await supabase.from('agent_logs').insert({
      agent_key: agent.key,
      event_type: 'whatsapp_notification_pending',
      metadata: {
        message: message.substring(0, 200),
        target_number: agent.whatsapp_number,
        reason: 'Missing WHATSAPP_API_KEY or WHATSAPP_PHONE_NUMBER_ID',
        status: 'pending',
        metadata: metadata
      }
    });
    return;
  }
  
  // Se credenciais existirem, fazer chamada real
  console.log(`[ACTION] Sending WhatsApp to ${agent.whatsapp_number}`);
  // TODO: Implementar chamada real quando credenciais estiverem configuradas
}
