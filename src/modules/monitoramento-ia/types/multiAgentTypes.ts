/**
 * Types for Multi-Agent System
 */

export type AgentType = 'vendas' | 'diretoria' | 'notificacao' | 'personalizado';

export type IntegrationProvider = 'none' | 'manychat' | 'string' | 'whatsapp-api';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  avatar: string;
  description: string;
  status: 'active' | 'inactive';
  provider: IntegrationProvider;
  phoneNumber: string | null;
  createdAt: string;
  updatedAt: string;
  config: {
    model: string;
    temperature: number;
    maxTokens: number;
    tone: 'formal' | 'friendly' | 'technical';
    creativity: 'low' | 'medium' | 'high';
    formality: 'low' | 'medium' | 'high';
  };
  prompt: {
    masterPrompt: string;
    conditionalInstructions: Array<{
      id: number;
      condition: string;
      action: string;
    }>;
    forbiddenWords: string[];
  };
  knowledge: Array<{
    id: number;
    title: string;
    content?: string;
    updatedAt: string;
    tags: string[];
    type: 'document' | 'faq' | 'policy';
  }>;
  rules: Array<{
    id: number;
    name: string;
    trigger: string;
    action: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    active: boolean;
  }>;
  integrationSettings?: {
    manychat?: {
      apiToken?: string;
      botId?: string;
      webhookUrl?: string;
    };
    string?: {
      agentId?: string;
      apiKey?: string;
      endpoint?: string;
    };
    whatsappApi?: {
      phoneNumberId?: string;
      accessToken?: string;
      webhookUrl?: string;
    };
  };
}

export interface AgentFormData {
  name: string;
  type: AgentType;
  avatar: string;
  description: string;
  phoneNumber: string | null;
  provider: IntegrationProvider;
}
