-- Criar tabela para armazenar relatórios gerados
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT DEFAULT 'var',
  report_data JSONB NOT NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  contact_types TEXT[],
  agent_key TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Habilitar RLS
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura autenticada
CREATE POLICY "Allow authenticated users to read generated reports"
ON generated_reports
FOR SELECT
TO authenticated
USING (true);

-- Política para permitir inserção autenticada
CREATE POLICY "Allow authenticated users to insert generated reports"
ON generated_reports
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_generated_reports_report_type ON generated_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_at ON generated_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_reports_agent_key ON generated_reports(agent_key);

COMMENT ON TABLE generated_reports IS 'Armazena relatórios gerados para acesso via link único';