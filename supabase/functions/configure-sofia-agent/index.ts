import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
const ELEVENLABS_AGENT_ID = Deno.env.get('ELEVENLABS_AGENT_ID');

// Sofia Gerente Master Prompt
const SOFIA_MASTER_PROMPT = `Você é SOFIA, a assistente de voz executiva da EXA Mídia. Você é inteligente, profissional e tem acesso total ao sistema quando autenticada.

## PERSONALIDADE
- Tom: Profissional mas acolhedor, como uma executiva competente
- Linguagem: Português brasileiro natural, evite termos técnicos desnecessários
- Postura: Confiante, eficiente, sempre focada em resolver
- Humor: Sutil quando apropriado, nunca forçado

## MODO DE OPERAÇÃO

### MODO NORMAL (sem autenticação)
Você pode responder sobre:
- Informações gerais da EXA Mídia
- Status básico do sistema (painéis online, prédios ativos)
- Métricas gerais de vendas do mês
- Ajudar a navegar o sistema

Para consultas detalhadas, você DEVE solicitar autenticação.

### MODO GERENTE MASTER (com autenticação 2FA)
Quando o usuário pedir informações sensíveis como:
- Conversas de clientes específicos
- Análise de calor de leads
- Leads em risco de abandono
- Relatórios financeiros detalhados
- Performance de agentes
- Dados de contratos
- Informações de clientes específicos

Você deve:
1. Usar a ferramenta "admin_auth" com action="check_session" para verificar se há sessão ativa
2. Se NÃO houver sessão ativa:
   - Informar que precisa de autorização
   - Usar "admin_auth" com action="request_code" para enviar código
   - Dizer: "Enviei um código de verificação para o administrador. Quando receber, me diga o código de 6 dígitos."
3. Quando o usuário disser o código:
   - Usar "admin_auth" com action="verify_code"
   - Se válido, confirmar: "Modo Gerente Master ativado! Você tem 5 minutos de acesso total."
4. Com sessão ativa, usar "consultar_sistema" livremente

## CONSULTAS DISPONÍVEIS (via ferramenta consultar_sistema)

### Consultas Básicas (sem autenticação necessária)
- overview: Visão geral do sistema
- panel_status: Status dos painéis
- query_buildings: Lista de prédios
- sales_metrics: Métricas de vendas

### Consultas Administrativas (requerem Modo Gerente Master)
- conversation_heat_analysis: Análise de calor das conversas
- leads_at_risk: Leads em risco de abandono
- abandoned_leads: Leads sem resposta
- agent_performance: Performance dos agentes Eduardo e Sofia
- full_financial_report: Relatório financeiro completo
- contract_status_full: Status detalhado de contratos
- read_conversation: Ler conversa específica
- client_details: Detalhes de cliente específico

## EXEMPLOS DE INTERAÇÃO

Usuário: "Quero ver as conversas quentes"
Sofia: "Para acessar a análise de calor das conversas, preciso ativar o Modo Gerente Master. Vou enviar um código de verificação para o administrador. Um momento..."
[usa admin_auth para request_code]
Sofia: "Código enviado! Quando receber, me diga os 6 dígitos."

Usuário: "O código é 485729"
[usa admin_auth para verify_code]
Sofia: "Modo Gerente Master ativado! Você tem 5 minutos de acesso completo. Deixa eu buscar a análise de calor das conversas..."
[usa consultar_sistema com intent=conversation_heat_analysis]
Sofia: [apresenta resultados de forma executiva]

## REGRAS DE OURO
1. NUNCA invente dados - sempre use as ferramentas
2. Para dados sensíveis, SEMPRE verifique autenticação primeiro
3. Seja concisa mas completa nas respostas
4. Se algo der erro, seja honesta e sugira alternativas
5. Mantenha o contexto da conversa
6. Ao final de consultas administrativas, pergunte se precisa de mais algo`;

// Tool definitions for ElevenLabs
const SOFIA_TOOLS = [
  {
    type: "webhook",
    name: "consultar_sistema",
    description: "Consulta dados do sistema EXA. Use para buscar informações sobre prédios, painéis, vendas, conversas, leads, contratos e métricas.",
    webhook: {
      url: `${supabaseUrl}/functions/v1/sofia-jarvis`,
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    },
    parameters: {
      type: "object",
      properties: {
        intent: {
          type: "string",
          description: "Tipo de consulta: overview, query_buildings, building_details, panel_status, sales_metrics, read_conversation, agent_conversations, search_conversations, get_contracts, financial_summary, overdue_payments, get_leads, search_client, client_details, crm_notes, get_proposals, order_details, daily_metrics, conversation_heat_analysis, leads_at_risk, abandoned_leads, agent_performance, full_financial_report, contract_status_full"
        },
        params_json: {
          type: "string",
          description: "Parâmetros da consulta em JSON. Ex: {\"period\":\"month\"} ou {\"contact_name\":\"João\"}"
        }
      },
      required: ["intent"]
    }
  },
  {
    type: "webhook",
    name: "admin_auth",
    description: "Gerencia autenticação do Modo Gerente Master. Use para verificar sessão, solicitar código, validar código ou encerrar sessão.",
    webhook: {
      url: `${supabaseUrl}/functions/v1/sofia-admin-auth`,
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    },
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Ação: check_session (verifica se há sessão ativa), request_code (envia código 2FA), verify_code (valida código), end_session (encerra sessão)"
        },
        user_phone: {
          type: "string",
          description: "Telefone do usuário solicitante"
        },
        user_name: {
          type: "string",
          description: "Nome do usuário (opcional)"
        },
        code: {
          type: "string",
          description: "Código de 6 dígitos para verificação (apenas para verify_code)"
        }
      },
      required: ["action"]
    }
  }
];

async function configureElevenLabsAgent(): Promise<{ success: boolean; message: string; details?: any }> {
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
    return {
      success: false,
      message: 'Credenciais do ElevenLabs não configuradas. Configure ELEVENLABS_API_KEY e ELEVENLABS_AGENT_ID.'
    };
  }

  console.log('[CONFIGURE-SOFIA] Starting configuration for agent:', ELEVENLABS_AGENT_ID);

  try {
    // First, get current agent configuration
    const getResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${ELEVENLABS_AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('[CONFIGURE-SOFIA] Failed to get agent:', errorText);
      return {
        success: false,
        message: `Erro ao buscar agente: ${getResponse.status}`,
        details: errorText
      };
    }

    const currentAgent = await getResponse.json();
    console.log('[CONFIGURE-SOFIA] Current agent name:', currentAgent.name);

    // Update agent configuration
    const updatePayload = {
      name: currentAgent.name || "Sofia - EXA Mídia",
      conversation_config: {
        ...currentAgent.conversation_config,
        agent: {
          ...currentAgent.conversation_config?.agent,
          prompt: {
            prompt: SOFIA_MASTER_PROMPT
          },
          first_message: "Olá! Sou a Sofia, assistente executiva da EXA Mídia. Como posso ajudar você hoje?",
          language: "pt"
        },
        tts: currentAgent.conversation_config?.tts || {}
      },
      platform_settings: {
        ...currentAgent.platform_settings,
        tools: SOFIA_TOOLS
      }
    };

    console.log('[CONFIGURE-SOFIA] Updating agent with new configuration...');

    const updateResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${ELEVENLABS_AGENT_ID}`,
      {
        method: 'PATCH',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('[CONFIGURE-SOFIA] Failed to update agent:', errorText);
      return {
        success: false,
        message: `Erro ao atualizar agente: ${updateResponse.status}`,
        details: errorText
      };
    }

    const updatedAgent = await updateResponse.json();
    console.log('[CONFIGURE-SOFIA] Agent updated successfully');

    // Log the configuration change
    await supabase.from('agent_logs').insert({
      agent_key: 'sofia',
      event_type: 'elevenlabs_configured',
      metadata: {
        agent_id: ELEVENLABS_AGENT_ID,
        tools_configured: SOFIA_TOOLS.map(t => t.name),
        prompt_length: SOFIA_MASTER_PROMPT.length,
        timestamp: new Date().toISOString()
      }
    });

    return {
      success: true,
      message: 'Agente Sofia configurado com sucesso no ElevenLabs!',
      details: {
        agent_id: ELEVENLABS_AGENT_ID,
        name: updatedAgent.name,
        tools: SOFIA_TOOLS.map(t => t.name),
        prompt_preview: SOFIA_MASTER_PROMPT.substring(0, 200) + '...'
      }
    };

  } catch (error) {
    console.error('[CONFIGURE-SOFIA] Error:', error);
    return {
      success: false,
      message: `Erro ao configurar agente: ${error.message}`,
      details: error
    };
  }
}

async function getAgentStatus(): Promise<any> {
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
    return { error: 'Credenciais não configuradas' };
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${ELEVENLABS_AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY
        }
      }
    );

    if (!response.ok) {
      return { error: `HTTP ${response.status}` };
    }

    const agent = await response.json();
    
    return {
      id: agent.agent_id,
      name: agent.name,
      created_at: agent.created_at,
      tools: agent.platform_settings?.tools?.map((t: any) => t.name) || [],
      has_prompt: !!agent.conversation_config?.agent?.prompt?.prompt,
      language: agent.conversation_config?.agent?.language
    };

  } catch (error) {
    return { error: error.message };
  }
}

// ==================== MAIN HANDLER ====================

serve(async (req) => {
  console.log(`[CONFIGURE-SOFIA] ${req.method} request at ${new Date().toISOString()}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method === 'GET') {
    const status = await getAgentStatus();
    return new Response(JSON.stringify({
      service: 'configure-sofia-agent',
      status: 'ok',
      agent: status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body = await req.json();
    const { action } = body;
    
    let result: any;
    
    switch (action) {
      case 'configure':
        result = await configureElevenLabsAgent();
        break;
        
      case 'status':
        result = await getAgentStatus();
        break;
        
      default:
        // Default action is configure
        result = await configureElevenLabsAgent();
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[CONFIGURE-SOFIA] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Erro interno',
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
