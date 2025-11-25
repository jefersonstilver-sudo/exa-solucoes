-- Criar tabela de alertas de painéis
CREATE TABLE IF NOT EXISTS panel_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('offline', 'online', 'critical', 'warning')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_panel_alerts_device_id ON panel_alerts(device_id);
CREATE INDEX idx_panel_alerts_created_at ON panel_alerts(created_at DESC);
CREATE INDEX idx_panel_alerts_resolved ON panel_alerts(resolved) WHERE NOT resolved;
CREATE INDEX idx_panel_alerts_type ON panel_alerts(alert_type);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_panel_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_panel_alerts_updated_at
  BEFORE UPDATE ON panel_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_panel_alerts_updated_at();

-- RLS
ALTER TABLE panel_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage panel alerts"
  ON panel_alerts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Tabela de configurações de monitoramento
CREATE TABLE IF NOT EXISTS panel_monitoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_interval_seconds INTEGER DEFAULT 30,
  offline_threshold_seconds INTEGER DEFAULT 300,
  alert_email TEXT,
  alert_webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE panel_monitoring_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage monitoring config"
  ON panel_monitoring_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Inserir configuração padrão
INSERT INTO panel_monitoring_config (check_interval_seconds, offline_threshold_seconds)
VALUES (30, 300)
ON CONFLICT DO NOTHING;