/**
 * Mock data for AI Agent features
 * IMPORTANT: This is FAKE data for UI demonstration only
 */

import type {
  AgentConfig,
  PromptBase,
  KnowledgeDocument,
  FAQ,
  KnowledgeBaseStats,
  ActionRule,
  RuleExecution,
  ManyChatIntegration,
  StringIntegration
} from './aiAgentTypes';

export const mockAgentConfig: AgentConfig = {
  name: "EXA Virtual Assistant",
  persona: "Profissional e Prestativa",
  tone: "formal",
  temperature: 0.7,
  maxTokens: 2000,
  creativity: "medium",
  formality: "high",
  safetyRules: [
    "Nunca expor dados sensíveis",
    "Validar identidade antes de ações críticas",
    "Escalonar para humano em casos complexos",
    "Registrar todas as interações"
  ],
  limits: {
    maxAttempts: 3,
    timeoutSeconds: 30,
    autoEscalate: true
  }
};

export const mockPromptBase: PromptBase = {
  masterPrompt: `Você é a EXA Virtual Assistant, uma IA especializada em atendimento corporativo para gestão de prédios e painéis publicitários digitais.

Sua função principal é:
- Auxiliar diretores e gestores no monitoramento de painéis
- Fornecer informações precisas sobre status de equipamentos
- Escalonar problemas críticos para equipe técnica
- Manter um tom profissional e prestativo

Regras importantes:
- Sempre confirme a identidade do usuário antes de fornecer dados sensíveis
- Priorize casos urgentes relacionados a múltiplos painéis offline
- Use linguagem clara e objetiva
- Quando não souber responder, escalone para atendimento humano`,
  conditionalInstructions: [
    { 
      id: 1,
      condition: "Usuário pergunta sobre preços", 
      action: "Informar que os valores variam por prédio e solicitar contato com equipe comercial" 
    },
    { 
      id: 2,
      condition: "Detecta urgência (palavras: urgente, crítico, parado)", 
      action: "Priorizar atendimento e notificar diretor responsável imediatamente" 
    },
    { 
      id: 3,
      condition: "Usuário se identifica como diretor autorizado", 
      action: "Conceder acesso a informações detalhadas e ações administrativas" 
    }
  ],
  forbiddenWords: ["não sei", "não posso", "erro", "bug", "falha no sistema"]
};

export const mockKnowledgeDocuments: KnowledgeDocument[] = [
  { 
    id: 1, 
    title: "Manual de Operação EXA 2025", 
    updatedAt: "2025-11-15", 
    tags: ["operação", "manual", "geral"],
    type: "document"
  },
  { 
    id: 2, 
    title: "Política de Atendimento ao Cliente", 
    updatedAt: "2025-11-10", 
    tags: ["atendimento", "política"],
    type: "policy"
  },
  { 
    id: 3, 
    title: "Especificações Técnicas dos Painéis", 
    updatedAt: "2025-11-20", 
    tags: ["painéis", "prédios", "técnico"],
    type: "document"
  },
  { 
    id: 4, 
    title: "Procedimentos de Emergência", 
    updatedAt: "2025-11-18", 
    tags: ["emergência", "procedimentos"],
    type: "policy"
  }
];

export const mockFAQs: FAQ[] = [
  { 
    id: 1, 
    question: "Como reportar um problema no painel?", 
    answer: "Acesse o sistema de monitoramento, selecione o painel com problema e clique em 'Reportar Problema'. Descreva o problema detalhadamente e anexe fotos se possível." 
  },
  { 
    id: 2, 
    question: "Quem são os diretores autorizados?", 
    answer: "Os diretores autorizados estão listados na seção 'Diretores' do sistema. Apenas pessoas nesta lista têm acesso a informações confidenciais." 
  },
  { 
    id: 3, 
    question: "Qual o prazo médio de resposta para problemas técnicos?", 
    answer: "Problemas críticos são atendidos em até 2 horas. Problemas de prioridade média em até 24 horas. Manutenções preventivas são agendadas com 48h de antecedência." 
  },
  { 
    id: 4, 
    question: "Como funcionam os alertas automáticos?", 
    answer: "O sistema monitora constantemente todos os painéis. Quando detecta anomalias (offline, temperatura alta, etc), envia alertas automáticos via SMS e email para os responsáveis." 
  }
];

export const mockKnowledgeStats: KnowledgeBaseStats = { 
  documents: 12, 
  faqs: 45, 
  policies: 8 
};

export const mockActionRules: ActionRule[] = [
  { 
    id: 1, 
    name: "Escalonar para Diretor", 
    trigger: "Painel offline > 30 min", 
    action: "Enviar notificação para diretor responsável",
    priority: "HIGH",
    active: true 
  },
  { 
    id: 2, 
    name: "Alerta de Múltiplos Painéis Offline", 
    trigger: "≥ 3 painéis offline simultâneos", 
    action: "Criar alerta crítico + enviar SMS",
    priority: "CRITICAL",
    active: true 
  },
  { 
    id: 3, 
    name: "Resposta Automática - Horário Comercial", 
    trigger: "Mensagem recebida entre 8h-18h", 
    action: "Responder automaticamente via ManyChat",
    priority: "MEDIUM",
    active: true 
  },
  { 
    id: 4, 
    name: "Escalonar Casos Complexos", 
    trigger: "IA não consegue resolver após 3 tentativas", 
    action: "Transferir para atendimento humano",
    priority: "HIGH",
    active: false 
  },
  { 
    id: 5, 
    name: "Notificação de Temperatura Crítica", 
    trigger: "Temperatura do painel > 80°C", 
    action: "Enviar alerta imediato e criar ticket de manutenção",
    priority: "CRITICAL",
    active: true 
  }
];

export const mockRuleExecutions: RuleExecution[] = [
  { id: 1, ruleId: 1, ruleName: "Escalonar para Diretor", timestamp: "2025-11-20T14:32:00", status: "success" },
  { id: 2, ruleId: 2, ruleName: "Alerta de Múltiplos Painéis Offline", timestamp: "2025-11-20T14:15:00", status: "success" },
  { id: 3, ruleId: 3, ruleName: "Resposta Automática - Horário Comercial", timestamp: "2025-11-20T13:58:00", status: "success" },
  { id: 4, ruleId: 1, ruleName: "Escalonar para Diretor", timestamp: "2025-11-20T12:45:00", status: "success" },
  { id: 5, ruleId: 5, ruleName: "Notificação de Temperatura Crítica", timestamp: "2025-11-20T11:20:00", status: "error" }
];

export const mockManyChatIntegration: ManyChatIntegration = {
  status: "connected",
  lastSync: "2025-11-20T14:35:00",
  totalFlows: 12,
  flows: [
    { id: 1, name: "Atendimento Inicial", active: true, messagesCount: 42 },
    { id: 2, name: "Suporte Técnico", active: true, messagesCount: 18 },
    { id: 3, name: "Escalonamento para Diretor", active: false, messagesCount: 0 },
    { id: 4, name: "FAQ Automatizado", active: true, messagesCount: 67 }
  ],
  attributes: ["user_type", "is_director", "building_id", "last_interaction"],
  logs: [
    { id: 1, timestamp: "14:35", message: "Mensagem recebida: 'Qual o status do painel 123?'", status: "success" },
    { id: 2, timestamp: "14:22", message: "Fluxo 'Atendimento Inicial' executado", status: "success" },
    { id: 3, timestamp: "13:58", message: "Nova conversa iniciada", status: "success" },
    { id: 4, timestamp: "13:45", message: "Usuário identificado como diretor", status: "success" },
    { id: 5, timestamp: "13:30", message: "FAQ respondida automaticamente", status: "success" }
  ]
};

export const mockStringIntegration: StringIntegration = {
  status: "pending",
  agentId: "agent_string_123",
  endpoint: "https://api.string.com/v1",
  workspaceId: "ws_exa_2025",
  flows: [
    { id: 1, name: "Fluxo Principal", status: "development" },
    { id: 2, name: "Fluxo de Suporte", status: "pending" },
    { id: 3, name: "Fluxo de Vendas", status: "pending" }
  ],
  autoActions: {
    autoRespond: false,
    escalateComplex: false,
    logConversations: false,
    integrateAlerts: false
  }
};
