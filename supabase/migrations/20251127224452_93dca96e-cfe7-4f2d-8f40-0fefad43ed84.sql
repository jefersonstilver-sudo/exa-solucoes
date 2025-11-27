-- Criar tabela de logs de conexão Z-API
CREATE TABLE IF NOT EXISTS zapi_connection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('connected', 'disconnected', 'reconnected', 'warning')),
  instance_id TEXT,
  phone TEXT,
  triggered_by TEXT DEFAULT 'system_check',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_zapi_connection_logs_agent_key ON zapi_connection_logs(agent_key);
CREATE INDEX IF NOT EXISTS idx_zapi_connection_logs_created_at ON zapi_connection_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zapi_connection_logs_event_type ON zapi_connection_logs(event_type);

-- Habilitar RLS
ALTER TABLE zapi_connection_logs ENABLE ROW LEVEL SECURITY;

-- Policy para super admins lerem
CREATE POLICY "Super admins can view zapi connection logs"
  ON zapi_connection_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'super_admin'
    )
  );

-- Policy para system inserir (service role)
CREATE POLICY "Service role can insert zapi connection logs"
  ON zapi_connection_logs FOR INSERT
  WITH CHECK (true);