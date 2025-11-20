-- ============================================================================
-- FASE 1: ESTRUTURA DE DADOS - SISTEMA DE AGENTES EXA
-- ============================================================================

-- Tabela: agents (substitui agents.json)
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ai', 'human', 'notification')),
  whatsapp_number TEXT,
  
  -- Configurações OpenAI
  openai_config JSONB DEFAULT '{"model":"gpt-4-turbo-preview","temperature":0.7,"max_tokens":2000}'::JSONB,
  
  -- Integração ManyChat
  manychat_connected BOOLEAN DEFAULT false,
  manychat_config JSONB DEFAULT '{"webhook_url":null,"flowId":null,"channelId":null}'::JSONB,
  
  -- Regras de roteamento
  routing_rules JSONB DEFAULT '[]'::JSONB,
  
  -- Base de conhecimento vinculada
  kb_ids JSONB DEFAULT '[]'::JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agents_key ON agents(key);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(is_active);

-- RLS Policies
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users full access to agents" ON agents;
CREATE POLICY "Allow authenticated users full access to agents"
  ON agents FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agents_updated_at ON agents;
CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_agents_updated_at();

-- ============================================================================
-- Tabela: agent_logs (auditoria de roteamento)
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  conversation_id TEXT,
  message_id TEXT,
  rule_used TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent ON agent_logs(agent_key);
CREATE INDEX IF NOT EXISTS idx_agent_logs_event ON agent_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created ON agent_logs(created_at DESC);

-- RLS
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read agent_logs" ON agent_logs;
CREATE POLICY "Allow authenticated read agent_logs"
  ON agent_logs FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Allow service role insert agent_logs" ON agent_logs;
CREATE POLICY "Allow service role insert agent_logs"
  ON agent_logs FOR INSERT 
  TO service_role 
  WITH CHECK (true);

-- ============================================================================
-- Tabela: knowledge_base (documentos indexados)
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key TEXT,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'indexing' CHECK (status IN ('indexing', 'ready', 'error')),
  storage_path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_knowledge_base_agent ON knowledge_base(agent_key);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_status ON knowledge_base(status);

-- RLS
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access knowledge_base" ON knowledge_base;
CREATE POLICY "Allow authenticated full access knowledge_base"
  ON knowledge_base FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- ============================================================================
-- INSERIR 4 AGENTES TEMPLATE
-- ============================================================================

-- 1. SOFIA (AI - Vendas/Leads)
INSERT INTO agents (key, display_name, description, type, openai_config, routing_rules)
VALUES (
  'sofia',
  'Sofia (Atendimento)',
  'Assistente de leads. Qualifica com score [0-100]. Score>=75 notifica Eduardo.',
  'ai',
  '{"model":"gpt-4-turbo-preview","temperature":0.7,"max_tokens":1500,"tone":"friendly"}'::JSONB,
  '[{"name":"lead_to_sofia","priority":80,"match":{"contains":["quero","comprar","preço","cotação","interessado"]},"target":"sofia","actions":["assign","notify_if_hot"]}]'::JSONB
)
ON CONFLICT (key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  openai_config = EXCLUDED.openai_config,
  routing_rules = EXCLUDED.routing_rules;

-- 2. IRIS (AI - Diretoria/BI)
INSERT INTO agents (key, display_name, description, type, openai_config, routing_rules)
VALUES (
  'iris',
  'IRIS (Diretoria)',
  'Assistente de gestão de incidentes e suporte à diretoria.',
  'ai',
  '{"model":"gpt-4-turbo-preview","temperature":0.5,"max_tokens":2000,"tone":"formal"}'::JSONB,
  '[{"name":"director_query","priority":90,"match":{"contains":["relatório","clientes","prédio","venda"]},"target":"iris","actions":["provide_bi"]}]'::JSONB
)
ON CONFLICT (key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  openai_config = EXCLUDED.openai_config,
  routing_rules = EXCLUDED.routing_rules;

-- 3. EXA ALERT (Notification - Alertas Críticos)
INSERT INTO agents (key, display_name, description, type, openai_config, routing_rules)
VALUES (
  'exa_alert',
  'EXA Alert (Notificações)',
  'Sistema de notificações. Classifica severidade e notifica diretores.',
  'notification',
  '{"model":"gpt-4-turbo-preview","temperature":0.0,"max_tokens":500,"tone":"formal"}'::JSONB,
  '[{"name":"if_panel_mention","priority":100,"match":{"any_of":["painel","offline","queda","screen"]},"target":"exa_alert","actions":["create_alert","notify_directors"]}]'::JSONB
)
ON CONFLICT (key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  openai_config = EXCLUDED.openai_config,
  routing_rules = EXCLUDED.routing_rules;

-- 4. EDUARDO (Human - Comercial)
INSERT INTO agents (key, display_name, description, type, whatsapp_number, routing_rules)
VALUES (
  'eduardo',
  'Eduardo (Comercial)',
  'Responsável comercial - recebe notificações de oportunidades (score>=75)',
  'human',
  '+5545991415856',
  '[{"name":"hot_lead_to_eduardo","priority":95,"match":{"score_threshold":75,"tags":["potential_sale","hot_lead"]},"target":"eduardo","actions":["notify_whatsapp"]}]'::JSONB
)
ON CONFLICT (key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  whatsapp_number = EXCLUDED.whatsapp_number,
  routing_rules = EXCLUDED.routing_rules;