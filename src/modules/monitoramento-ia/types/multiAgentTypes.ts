/**
 * Types for Multi-Agent System
 */

export type AgentType = 'vendas' | 'diretoria' | 'notificacao' | 'personalizado';

export type IntegrationProvider = 'none' | 'manychat' | 'string';

export interface Agent {
  id: string;
  key: string;
  name: string;
  type: AgentType;
  avatar: string;
  description: string;
  status: 'active' | 'inactive';
  provider: IntegrationProvider;
  phoneNumber: string | null;
  whatsappProvider?: 'manychat' | 'zapi' | 'none';
  whatsappNumber?: string | null;
  aiAutoResponse?: boolean;
  zapiConfig?: {
    instance_id: string;
    token: string;
    api_url: string;
    webhook_url: string;
    status: 'connected' | 'pending_setup';
  } | null;
  createdAt: string;
  updatedAt: string;
  config: {
    model: string;
    temperature: number;
    maxTokens: number;
    tone: 'formal' | 'friendly' | 'technical';
    creativity: 'low' | 'medium' | 'high';
    formality: 'low' | 'medium' | 'high';
    typingIndicator?: boolean;
    typingSpeed?: number;
    audio_transcription_enabled?: boolean;
    audio_language?: 'pt' | 'en' | 'es';
    audio_prompt?: string;
    audio_max_duration?: number;
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
  sections?: Array<{
    id: string;
    agent_id: string;
    section_number: number;
    section_title: string;
    content: string;
    created_at: string;
    updated_at: string;
  }>;
  knowledgeItems?: Array<{
    id: string;
    agent_id: string;
    title: string;
    description?: string;
    content: string;
    content_type: 'text' | 'pdf' | 'link';
    keywords: string[];
    instruction?: string;
    active: boolean;
    created_at: string;
    updated_at: string;
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
      verifyToken?: string;
      secret?: string;
      status?: 'pending' | 'connected' | 'error';
      lastSync?: string | null;
      errorMessage?: string;
    };
    string?: {
      agentId?: string;
      apiKey?: string;
      endpoint?: string;
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
