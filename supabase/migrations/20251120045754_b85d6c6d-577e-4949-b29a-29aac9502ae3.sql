-- FASE 1: Estrutura de Dados

-- Tabela de Diretores Autorizados (acesso IRIS)
CREATE TABLE IF NOT EXISTS diretores_autorizados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  whatsapp_number text NOT NULL UNIQUE,
  email text,
  cargo text,
  nivel_acesso text CHECK (nivel_acesso IN ('basico', 'pleno', 'total')) DEFAULT 'basico',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diretores_whatsapp ON diretores_autorizados(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_diretores_active ON diretores_autorizados(is_active);

-- Tabela de Qualificação de Leads (Sofia)
CREATE TABLE IF NOT EXISTS lead_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id text NOT NULL,
  contact_number text NOT NULL,
  contact_name text,
  score integer CHECK (score >= 0 AND score <= 100),
  classification text CHECK (classification IN ('frio', 'morno', 'quente', 'muito_quente')),
  interest_areas text[],
  budget_range text,
  timeline text,
  notes text,
  spin_situation integer DEFAULT 0 CHECK (spin_situation >= 0 AND spin_situation <= 3),
  spin_problem integer DEFAULT 0 CHECK (spin_problem >= 0 AND spin_problem <= 3),
  spin_implication integer DEFAULT 0 CHECK (spin_implication >= 0 AND spin_implication <= 3),
  spin_need integer DEFAULT 0 CHECK (spin_need >= 0 AND spin_need <= 3),
  profile_type text,
  qualified_by text DEFAULT 'sofia',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_conv ON lead_qualifications(conversation_id);
CREATE INDEX IF NOT EXISTS idx_lead_score ON lead_qualifications(score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_classification ON lead_qualifications(classification);

-- Tabela de Base de Conhecimento por Agente
CREATE TABLE IF NOT EXISTS agent_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key text NOT NULL,
  section text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_agent ON agent_knowledge(agent_key);
CREATE INDEX IF NOT EXISTS idx_knowledge_section ON agent_knowledge(section);
CREATE INDEX IF NOT EXISTS idx_knowledge_active ON agent_knowledge(is_active);

-- Tabela de Conversas de Preview
CREATE TABLE IF NOT EXISTS agent_preview_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key text NOT NULL,
  messages jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_preview_agent ON agent_preview_conversations(agent_key);

-- Atualizar configuração dos agentes
UPDATE agents SET
  display_name = 'Sofia - Vendas EXA',
  description = 'Agente de pré-vendas e qualificação de leads para painéis publicitários',
  openai_config = jsonb_build_object(
    'model', 'gpt-4',
    'temperature', 0.7,
    'max_tokens', 1500
  ),
  manychat_config = jsonb_build_object(
    'status', 'awaiting_number',
    'webhook_url_template', 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/webhook-manychat/sofia'
  ),
  manychat_connected = false
WHERE key = 'sofia';

UPDATE agents SET
  display_name = 'IRIS - Diretoria',
  description = 'Agente exclusiva para diretores autorizados',
  openai_config = jsonb_build_object(
    'model', 'gpt-4',
    'temperature', 0.5,
    'max_tokens', 2000
  ),
  manychat_config = jsonb_build_object(
    'status', 'awaiting_number',
    'restricted_access', true,
    'webhook_url_template', 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/webhook-manychat/iris'
  ),
  manychat_connected = false
WHERE key = 'iris';

UPDATE agents SET
  display_name = 'EXA Alert - Notificações',
  description = 'Sistema de notificações críticas e alertas',
  openai_config = jsonb_build_object(
    'model', 'gpt-4',
    'temperature', 0,
    'max_tokens', 500
  ),
  manychat_config = jsonb_build_object(
    'status', 'awaiting_number',
    'notification_only', true,
    'webhook_url_template', 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/webhook-manychat/exa_alert'
  ),
  manychat_connected = false
WHERE key = 'exa_alert';