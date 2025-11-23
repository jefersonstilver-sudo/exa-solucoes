-- Tabela para configurações de alertas por dispositivo
CREATE TABLE IF NOT EXISTS device_alert_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  alerts_enabled BOOLEAN DEFAULT true,
  offline_threshold_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id)
);

CREATE INDEX IF NOT EXISTS idx_device_alert_configs_device_id ON device_alert_configs(device_id);

ALTER TABLE device_alert_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage alert configs" ON device_alert_configs FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin'))
);

CREATE POLICY "System read alert configs" ON device_alert_configs FOR SELECT USING (true);