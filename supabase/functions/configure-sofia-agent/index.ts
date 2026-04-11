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

// Sofia Gerente Master Prompt - COMPLETO
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

## ========================================
## GUIA COMPLETO DE CONSULTAS
## ========================================

### 📊 VISÃO GERAL E DASHBOARD
| Pergunta do Usuário | Intent | Parâmetros |
|---------------------|--------|------------|
| "Me dá um resumo geral" | overview | - |
| "Como está o sistema?" | overview | - |
| "Quero ver o dashboard" | overview | - |
| "Métricas do dia" | daily_metrics | - |

### 💰 PROPOSTAS COMERCIAIS (ofertas enviadas a clientes)
| Pergunta do Usuário | Intent | Parâmetros |
|---------------------|--------|------------|
| "Quais propostas temos?" | proposals | - |
| "Listar todas propostas" | proposals | - |
| "Propostas do mês" | proposals | {"period":"month"} |
| "Propostas da semana" | proposals | {"period":"week"} |
| "Propostas de hoje" | proposals | {"period":"today"} |
| "Tem proposta sendo vista agora?" | propostas_quentes | - |
| "Propostas quentes" | propostas_quentes | - |
| "Detalhes da proposta EXA-2025-001" | proposal_details | {"proposal_number":"EXA-2025-001"} |
| "Última proposta enviada" | proposals | {"limit":1} |

### 📦 PEDIDOS (vendas confirmadas após pagamento)
| Pergunta do Usuário | Intent | Parâmetros |
|---------------------|--------|------------|
| "Quais pedidos ativos?" | pedidos | - |
| "Listar pedidos" | pedidos | - |
| "Pedidos do mês" | pedidos | {"period":"month"} |
| "Detalhes do pedido X" | order_details | {"order_id":"xxx"} |
| "Vendas de hoje" | sales_metrics | {"period":"today"} |
| "Vendas da semana" | sales_metrics | {"period":"week"} |
| "Vendas do mês" | sales_metrics | {"period":"month"} |
| "Métricas de vendas" | sales_metrics | - |

### 📝 CONTRATOS LEGAIS (documentos para assinatura)
| Pergunta do Usuário | Intent | Parâmetros |
|---------------------|--------|------------|
| "Quais contratos temos?" | get_contracts | - |
| "Contratos pendentes" | get_contracts | {"status":"enviado"} |
| "Contratos assinados" | get_contracts | {"status":"assinado"} |
| "Status dos contratos" | contract_status_full | - |
| "Relatório de contratos" | contract_status_full | - |

### 💬 CONVERSAS DOS AGENTES (Eduardo e Sofia)
| Pergunta do Usuário | Intent | Parâmetros |
|---------------------|--------|------------|
| "Eduardo falou com quantas pessoas hoje?" | eduardo_today | - |
| "Conversas do Eduardo hoje" | eduardo_today | - |
| "Com quem Eduardo conversou?" | eduardo_today | - |
| "Conversas da Sofia hoje" | agent_conversations | {"agent_key":"sofia"} |
| "Conversas do Eduardo ontem" | agent_conversations | {"agent_key":"eduardo","period":"yesterday"} |
| "Conversas do Eduardo semana" | agent_conversations | {"agent_key":"eduardo","period":"week"} |
| "Ler conversa com João" | read_conversation | {"contact_name":"João"} |
| "Ver conversa do Alencar" | read_conversation | {"contact_name":"Alencar"} |
| "Histórico completo com Maria" | historico_completo | {"contact_name":"Maria"} |
| "Todas mensagens do cliente X" | full_conversation_history | {"contact_name":"X"} |
| "Buscar conversa sobre orçamento" | search_conversations | {"query":"orçamento"} |
| "Performance dos agentes" | agent_performance | - |

### 🏢 PRÉDIOS E PAINÉIS
| Pergunta do Usuário | Intent | Parâmetros |
|---------------------|--------|------------|
| "Quantos prédios temos?" | query_buildings | - |
| "Listar prédios" | query_buildings | - |
| "Prédios ativos" | query_buildings | {"status":"active"} |
| "Detalhes do prédio X" | building_details | {"building_name":"X"} |
| "Status dos painéis" | panel_status | - |
| "Painéis online" | panel_status | - |
| "Quantos painéis ativos?" | panel_status | - |

### 👥 CLIENTES E LEADS
| Pergunta do Usuário | Intent | Parâmetros |
|---------------------|--------|------------|
| "Buscar cliente João" | search_client | {"query":"João"} |
| "Informações do cliente X" | client_details | {"client_name":"X"} |
| "Listar leads" | get_leads | - |
| "Leads quentes" | get_leads | {"temperature":"hot"} |
| "Leads em risco" | leads_at_risk | - |
| "Leads abandonados" | abandoned_leads | - |
| "Análise de calor" | conversation_heat_analysis | - |

### 💵 FINANCEIRO
| Pergunta do Usuário | Intent | Parâmetros |
|---------------------|--------|------------|
| "Resumo financeiro" | financial_summary | - |
| "Pagamentos atrasados" | overdue_payments | - |
| "Relatório financeiro completo" | full_financial_report | - |
| "Faturamento do mês" | sales_metrics | {"period":"month"} |

### 📺 VÍDEOS E CAMPANHAS
| Pergunta do Usuário | Intent | Parâmetros |
|---------------------|--------|------------|
| "Listar vídeos" | videos | - |
| "Campanhas ativas" | get_campaigns | - |
| "Benefícios disponíveis" | get_benefits | - |

## ========================================
## EXEMPLOS PRÁTICOS DE USO
## ========================================

### Exemplo 1: Usuário pergunta sobre propostas
Usuário: "Quais propostas temos em andamento?"
→ Use consultar_sistema com intent="proposals"
→ Responda: "Temos X propostas ativas. A mais recente é EXA-2025-XXX para o cliente Y no valor de Z reais..."

### Exemplo 2: Usuário quer saber sobre Eduardo
Usuário: "Eduardo falou com quantas pessoas hoje?"
→ Use consultar_sistema com intent="eduardo_today"
→ Responda: "Hoje o Eduardo conversou com X pessoas: [lista de nomes]. Foram Y mensagens trocadas no total."

### Exemplo 3: Usuário quer ler uma conversa específica
Usuário: "Quero ver a conversa com o Alencar"
→ Use consultar_sistema com intent="read_conversation" e params_json={"contact_name":"Alencar"}
→ Responda com resumo da conversa ou detalhes relevantes

### Exemplo 4: Usuário quer visão geral
Usuário: "Me dá um resumo de tudo"
→ Use consultar_sistema com intent="overview"
→ Responda: "Aqui está o panorama: X prédios ativos, Y painéis online, Z propostas em andamento, W pedidos ativos..."

### Exemplo 5: Usuário pergunta sobre contratos
Usuário: "Tem algum contrato pendente de assinatura?"
→ Use consultar_sistema com intent="get_contracts" com params_json={"status":"enviado"}
→ Responda: "Temos X contratos aguardando assinatura..."

## DISTINÇÃO CRÍTICA - PROPOSTA vs CONTRATO vs PEDIDO
- PROPOSTA (intent: proposals): Oferta comercial ANTES do pagamento. Tabela: proposals.
- PEDIDO (intent: pedidos): Venda confirmada APÓS aceite da proposta. Tabela: pedidos.
- CONTRATO (intent: get_contracts): Documento jurídico para assinatura. Tabela: contratos_legais.

FLUXO: PROPOSTA → PEDIDO (pagamento) → CONTRATO (assinatura)

## REGRAS DE OURO
1. NUNCA invente dados - SEMPRE use as ferramentas
2. Para dados sensíveis, SEMPRE verifique autenticação primeiro
3. Seja concisa mas completa nas respostas
4. Se algo der erro, seja honesta e sugira alternativas
5. Mantenha o contexto da conversa
6. Ao final de consultas administrativas, pergunte se precisa de mais algo
7. Use os intents EXATAMENTE como documentados acima
8. Para conversas de agentes, SEMPRE forneça números específicos`;

// Tool definitions for ElevenLabs - EXPANDIDO
const SOFIA_TOOLS = [
  {
    type: "webhook",
    name: "consultar_sistema",
    description: `Consulta TODOS os dados do sistema EXA. VOCÊ DEVE USAR ESTA FERRAMENTA para responder perguntas sobre o sistema.

=== INTENTS DISPONÍVEIS ===

VISÃO GERAL:
- overview → Dashboard completo do sistema
- daily_metrics → Métricas do dia

PROPOSTAS (ofertas comerciais):
- proposals → Lista todas propostas (params: period=today/week/month)
- propostas_quentes → Propostas sendo visualizadas agora
- proposal_details → Detalhes de uma proposta (params: proposal_number)

PEDIDOS (vendas confirmadas):
- pedidos → Lista pedidos ativos
- order_details → Detalhes de um pedido (params: order_id)
- sales_metrics → Métricas de vendas (params: period)

CONTRATOS (documentos legais):
- get_contracts → Lista contratos (params: status)
- contract_status_full → Status detalhado de todos contratos

CONVERSAS DOS AGENTES:
- eduardo_today → Conversas do Eduardo HOJE
- agent_conversations → Conversas de qualquer agente (params: agent_key, period)
- read_conversation → Ler conversa específica (params: contact_name)
- historico_completo → Histórico completo com um contato (params: contact_name)
- search_conversations → Buscar conversas (params: query)
- agent_performance → Performance dos agentes

PRÉDIOS E PAINÉIS:
- query_buildings → Lista prédios
- panel_status → Status dos painéis

CLIENTES E LEADS:
- search_client → Buscar cliente (params: query)
- client_details → Detalhes do cliente
- get_leads → Listar leads
- leads_at_risk → Leads em risco
- conversation_heat_analysis → Análise de calor

FINANCEIRO:
- financial_summary → Resumo financeiro
- overdue_payments → Pagamentos atrasados
- full_financial_report → Relatório completo

=== EXEMPLOS DE USO ===
"Eduardo falou com quantas pessoas hoje?" → intent="eduardo_today"
"Quais propostas temos?" → intent="proposals"
"Contratos pendentes" → intent="get_contracts", params={"status":"enviado"}
"Ler conversa com João" → intent="read_conversation", params={"contact_name":"João"}`,
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
          description: `O tipo de consulta. Use EXATAMENTE um destes valores:
VISÃO GERAL: overview, daily_metrics
PROPOSTAS: proposals, propostas_quentes, proposal_details, listar_propostas
PEDIDOS: pedidos, order_details, sales_metrics, vendas
CONTRATOS: get_contracts, contract_status_full, contratos
CONVERSAS: eduardo_today, eduardo_hoje, agent_conversations, read_conversation, historico_completo, search_conversations, full_conversation_history, ler_conversa, ver_conversa
PRÉDIOS: query_buildings, building_details, predios
PAINÉIS: panel_status, paineis
CLIENTES: search_client, client_details, get_leads, leads_at_risk, abandoned_leads, conversation_heat_analysis
FINANCEIRO: financial_summary, overdue_payments, full_financial_report
OUTROS: videos, get_campaigns, get_benefits, agent_performance`
        },
        params_json: {
          type: "string",
          description: `Parâmetros opcionais em formato JSON. Exemplos:
- Para período: {"period":"today"} ou {"period":"week"} ou {"period":"month"} ou {"period":"yesterday"}
- Para agente: {"agent_key":"eduardo"} ou {"agent_key":"sofia"}
- Para contato: {"contact_name":"Nome do Contato"}
- Para busca: {"query":"termo de busca"}
- Para proposta: {"proposal_number":"EXA-2025-001"}
- Para pedido: {"order_id":"id-do-pedido"}
- Para status: {"status":"enviado"} ou {"status":"assinado"}`
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
