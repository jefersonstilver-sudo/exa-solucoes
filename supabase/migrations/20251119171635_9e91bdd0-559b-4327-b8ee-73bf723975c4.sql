-- ====================================================================
-- MÓDULO: IA & MONITORAMENTO EXA
-- OBJETIVO: Criar estrutura de tabelas para monitoramento de painéis,
--           conversas WhatsApp, análises de IA e console de diretores
-- ====================================================================

-- 1) Tabela: directors
-- Diretores autorizados a interagir com a IA
CREATE TABLE IF NOT EXISTS directors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Tabela: devices
-- Painéis monitorados via AnyDesk
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  condominio_name TEXT NOT NULL,
  anydesk_client_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'unknown',
  last_online_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3) Tabela: device_alerts
-- Registro de alertas: quedas, instabilidades, etc.
CREATE TABLE IF NOT EXISTS device_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  severity TEXT DEFAULT 'medium',
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  evidence JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4) Tabela: conversations
-- Conversas do número comercial WhatsApp
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  contact_name TEXT,
  contact_phone TEXT NOT NULL,
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  status TEXT DEFAULT 'open',
  contact_type TEXT DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5) Tabela: messages
-- Mensagens dentro de uma conversa
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  from_role TEXT NOT NULL,
  body TEXT NOT NULL,
  has_image BOOLEAN DEFAULT false,
  has_audio BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6) Tabela: analyses
-- Análise da IA sobre conversas
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  analysis_at TIMESTAMPTZ DEFAULT now(),
  summary TEXT,
  intent TEXT,
  opportunity BOOLEAN DEFAULT false,
  response_quality_score INTEGER,
  sla_violations JSONB DEFAULT '{}'::jsonb,
  suggested_reply TEXT,
  raw_payload JSONB DEFAULT '{}'::jsonb
);

-- 7) Tabela: agent_context
-- Base de conhecimento da IA
CREATE TABLE IF NOT EXISTS agent_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8) Tabela: ia_console_messages
-- Console interno da IA no painel Lovable
CREATE TABLE IF NOT EXISTS ia_console_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_id UUID NOT NULL REFERENCES directors(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_device_alerts_device_id ON device_alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_device_alerts_status ON device_alerts(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_analyses_conversation_id ON analyses(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ia_console_messages_director_id ON ia_console_messages(director_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_phone ON conversations(contact_phone);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_directors_phone ON directors(phone);

-- Comentários nas tabelas para documentação
COMMENT ON TABLE directors IS 'Diretores autorizados a interagir com a IA do sistema EXA';
COMMENT ON TABLE devices IS 'Painéis digitais monitorados via AnyDesk';
COMMENT ON TABLE device_alerts IS 'Alertas de status dos painéis (offline, instabilidade, etc.)';
COMMENT ON TABLE conversations IS 'Conversas do WhatsApp comercial';
COMMENT ON TABLE messages IS 'Mensagens individuais dentro das conversas';
COMMENT ON TABLE analyses IS 'Análises automáticas da IA sobre conversas';
COMMENT ON TABLE agent_context IS 'Base de conhecimento e contexto da agente IA';
COMMENT ON TABLE ia_console_messages IS 'Mensagens do console interno entre diretores e IA';