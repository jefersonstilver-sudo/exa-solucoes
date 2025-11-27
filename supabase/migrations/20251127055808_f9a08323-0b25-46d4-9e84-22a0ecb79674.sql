-- Criar tabela para configurações de relatórios diários
CREATE TABLE IF NOT EXISTS daily_report_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT false,
  schedule_time TIME DEFAULT '06:00:00',
  recipient_emails TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Apenas uma configuração por sistema
CREATE UNIQUE INDEX IF NOT EXISTS daily_report_config_singleton ON daily_report_config ((true));

-- Inserir configuração padrão
INSERT INTO daily_report_config (enabled, schedule_time, recipient_emails)
VALUES (false, '06:00:00', '{}')
ON CONFLICT DO NOTHING;

-- Tabela para armazenar histórico de relatórios enviados
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date DATE NOT NULL,
  agent_key TEXT NOT NULL DEFAULT 'eduardo',
  metrics JSONB NOT NULL,
  ai_analysis JSONB NOT NULL,
  pdf_url TEXT,
  sent_to TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reports_agent ON daily_reports(agent_key);

-- RLS Policies
ALTER TABLE daily_report_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver/editar configurações
CREATE POLICY "Admins can manage daily report config"
  ON daily_report_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Apenas admins podem ver relatórios
CREATE POLICY "Admins can view daily reports"
  ON daily_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_daily_report_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_report_config_updated_at
  BEFORE UPDATE ON daily_report_config
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_report_config_updated_at();