-- Create table for multiple offline alert rules
CREATE TABLE IF NOT EXISTS panel_offline_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  tempo_offline_segundos INTEGER NOT NULL DEFAULT 60,
  intervalo_repeticao_segundos INTEGER DEFAULT 300,
  repetir_ate_resolver BOOLEAN DEFAULT false,
  notificar_quando_online BOOLEAN DEFAULT true,
  ativo BOOLEAN DEFAULT true,
  prioridade INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE panel_offline_alert_rules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage alert rules"
  ON panel_offline_alert_rules FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default rules migrated from old config if exists
INSERT INTO panel_offline_alert_rules (nome, descricao, tempo_offline_segundos, intervalo_repeticao_segundos, repetir_ate_resolver, notificar_quando_online, ativo, prioridade)
SELECT 
  'Alerta Rápido',
  'Alerta imediato quando painel fica offline',
  COALESCE(tempo_offline_minutos, 60),
  COALESCE(intervalo_repeticao_minutos, 300),
  COALESCE(repetir_ate_resolver, false),
  COALESCE(notificar_quando_online, true),
  COALESCE(ativo, true),
  1
FROM panel_offline_alert_config
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert default rule if no migration occurred
INSERT INTO panel_offline_alert_rules (nome, descricao, tempo_offline_segundos, intervalo_repeticao_segundos, repetir_ate_resolver, notificar_quando_online, ativo, prioridade)
SELECT 'Alerta Rápido', 'Alerta quando painel fica offline', 60, 300, false, true, true, 1
WHERE NOT EXISTS (SELECT 1 FROM panel_offline_alert_rules);

-- Add column to track which rule triggered alert in devices metadata
-- This will be handled via the metadata JSONB field

-- Add column to panel_offline_alerts_history to track which rule was triggered
ALTER TABLE panel_offline_alerts_history 
ADD COLUMN IF NOT EXISTS regra_id UUID REFERENCES panel_offline_alert_rules(id),
ADD COLUMN IF NOT EXISTS regra_nome TEXT;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_panel_offline_alert_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_panel_offline_alert_rules_updated_at ON panel_offline_alert_rules;
CREATE TRIGGER update_panel_offline_alert_rules_updated_at
  BEFORE UPDATE ON panel_offline_alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_panel_offline_alert_rules_updated_at();