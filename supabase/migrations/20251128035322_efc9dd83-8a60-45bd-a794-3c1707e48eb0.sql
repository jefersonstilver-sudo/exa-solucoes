-- Criar tabela para tokens de acesso aos relatórios
CREATE TABLE IF NOT EXISTS report_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES generated_reports(id) ON DELETE CASCADE,
  admin_id UUID,
  access_granted_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar acessos de um relatório
CREATE INDEX IF NOT EXISTS idx_report_access_tokens_report_id 
ON report_access_tokens(report_id);

-- Índice para buscar acessos de um admin
CREATE INDEX IF NOT EXISTS idx_report_access_tokens_admin_id 
ON report_access_tokens(admin_id);

-- RLS policies
ALTER TABLE report_access_tokens ENABLE ROW LEVEL SECURITY;

-- Service role pode fazer tudo
CREATE POLICY "Service role can manage access tokens"
ON report_access_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);