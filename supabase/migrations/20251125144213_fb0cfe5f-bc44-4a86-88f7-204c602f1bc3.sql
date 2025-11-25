-- Adicionar campos para rastrear origem da classificação de contato
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS contact_type_source TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS contact_type_updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS contact_type_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN conversations.contact_type_source IS 'Origem da classificação: ai, manual, ou unknown';
COMMENT ON COLUMN conversations.contact_type_updated_by IS 'Usuário que fez a última atualização manual';
COMMENT ON COLUMN conversations.contact_type_updated_at IS 'Data da última atualização do tipo';

-- Criar tabela para armazenar relatórios de conversas gerados pela IA
CREATE TABLE IF NOT EXISTS conversation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  agent_key TEXT NOT NULL,
  report_data JSONB NOT NULL,
  summary TEXT,
  contact_profile JSONB,
  interests JSONB DEFAULT '[]'::jsonb,
  conversation_stage TEXT,
  recommendations JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversation_reports_conversation_id ON conversation_reports(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_reports_agent_key ON conversation_reports(agent_key);
CREATE INDEX IF NOT EXISTS idx_conversation_reports_generated_at ON conversation_reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_type_source ON conversations(contact_type_source);

-- RLS policies para conversation_reports
ALTER TABLE conversation_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem ver relatórios"
  ON conversation_reports FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar relatórios"
  ON conversation_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND generated_by = auth.uid());