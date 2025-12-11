-- 1. Adicionar botão "Interromper Notificações" se não existir
INSERT INTO panel_offline_alert_buttons (id, label, emoji, ordem, ativo)
SELECT gen_random_uuid(), 'Interromper Notificações', '🛑', 3, true
WHERE NOT EXISTS (
  SELECT 1 FROM panel_offline_alert_buttons WHERE label = 'Interromper Notificações'
);

-- 2. Resetar metadata dos devices Provence para forçar novos alertas com device_id correto
UPDATE devices 
SET metadata = jsonb_build_object(
  'offline_alert_count', 0,
  'triggered_rules', '[]'::jsonb,
  'current_incident_id', null,
  'incident_number', COALESCE((metadata->>'incident_number')::int, 0),
  'notifications_paused_until', null,
  'last_offline_alert_at', null
)
WHERE name ILIKE '%provence%';

-- 3. Adicionar colunas incident se não existirem em panel_offline_alerts_history
ALTER TABLE panel_offline_alerts_history 
ADD COLUMN IF NOT EXISTS incident_id UUID,
ADD COLUMN IF NOT EXISTS incident_number INT,
ADD COLUMN IF NOT EXISTS alert_number INT;