/**
 * Types for AI Agent configuration and management
 */

export interface AgentConfig {
  name: string;
  persona: string;
  tone: 'formal' | 'friendly' | 'technical';
  temperature: number;
  maxTokens: number;
  creativity: 'low' | 'medium' | 'high';
  formality: 'low' | 'medium' | 'high';
  safetyRules: string[];
  limits: {
    maxAttempts: number;
    timeoutSeconds: number;
    autoEscalate: boolean;
  };
}

export interface PromptBase {
  masterPrompt: string;
  conditionalInstructions: ConditionalInstruction[];
  forbiddenWords: string[];
}

export interface ConditionalInstruction {
  id: number;
  condition: string;
  action: string;
}

export interface KnowledgeDocument {
  id: number;
  title: string;
  updatedAt: string;
  tags: string[];
  type: 'document' | 'faq' | 'policy';
}

export interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export interface KnowledgeBaseStats {
  documents: number;
  faqs: number;
  policies: number;
}

export interface ActionRule {
  id: number;
  name: string;
  trigger: string;
  action: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  active: boolean;
}

export interface RuleExecution {
  id: number;
  ruleId: number;
  ruleName: string;
  timestamp: string;
  status: 'success' | 'error';
}

export interface ManyChatFlow {
  id: number;
  name: string;
  active: boolean;
  messagesCount: number;
}

export interface ManyChatLog {
  id: number;
  timestamp: string;
  message: string;
  status: 'success' | 'error';
}

export interface ManyChatIntegration {
  status: 'connected' | 'pending' | 'error';
  lastSync: string;
  totalFlows: number;
  flows: ManyChatFlow[];
  attributes: string[];
  logs: ManyChatLog[];
}

export interface StringFlow {
  id: number;
  name: string;
  status: 'active' | 'development' | 'pending';
}

export interface StringIntegration {
  status: 'connected' | 'pending' | 'error';
  agentId: string;
  endpoint: string;
  workspaceId: string;
  flows: StringFlow[];
  autoActions: {
    autoRespond: boolean;
    escalateComplex: boolean;
    logConversations: boolean;
    integrateAlerts: boolean;
  };
}
