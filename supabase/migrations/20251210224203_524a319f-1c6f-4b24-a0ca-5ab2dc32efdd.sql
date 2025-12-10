-- Add incident tracking columns to panel_offline_alerts_history
ALTER TABLE panel_offline_alerts_history 
ADD COLUMN IF NOT EXISTS incident_id UUID,
ADD COLUMN IF NOT EXISTS incident_number INTEGER,
ADD COLUMN IF NOT EXISTS alert_number INTEGER DEFAULT 1;

-- Add incident tracking to confirmations
ALTER TABLE panel_offline_alert_confirmations
ADD COLUMN IF NOT EXISTS alert_number INTEGER,
ADD COLUMN IF NOT EXISTS incident_id UUID,
ADD COLUMN IF NOT EXISTS incident_number INTEGER;

-- Create RPC function to reset alert metadata when rule is toggled off
CREATE OR REPLACE FUNCTION reset_device_alert_metadata_for_rule(p_rule_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Reset metadata for devices that had this rule triggered
  UPDATE devices
  SET metadata = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{triggered_rules}', '[]'::jsonb
          ),
          '{offline_alert_count}', '0'::jsonb
        ),
        '{last_offline_alert_at}', 'null'::jsonb
      ),
      '{current_incident_id}', 'null'::jsonb
    ),
    '{notifications_paused_until}', 'null'::jsonb
  )
  WHERE metadata::jsonb->'triggered_rules' ? p_rule_id::text;
  
  -- Log the reset
  INSERT INTO log_eventos_sistema (tipo_evento, descricao)
  VALUES ('ALERT_METADATA_RESET', format('Alert metadata reset for rule %s', p_rule_id));
END;
$$;

-- Create index for faster incident lookups
CREATE INDEX IF NOT EXISTS idx_alerts_history_incident 
ON panel_offline_alerts_history(incident_id, incident_number);

CREATE INDEX IF NOT EXISTS idx_confirmations_incident 
ON panel_offline_alert_confirmations(incident_id, alert_number);