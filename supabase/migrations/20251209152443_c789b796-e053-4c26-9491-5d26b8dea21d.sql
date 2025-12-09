-- Function to safely update device alert metadata with JSONB merge
CREATE OR REPLACE FUNCTION update_device_alert_metadata(
  p_device_id UUID,
  p_last_offline_alert_at TIMESTAMPTZ,
  p_offline_alert_count INTEGER,
  p_triggered_rules TEXT[],
  p_last_rule_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE devices
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'last_offline_alert_at', p_last_offline_alert_at,
    'offline_alert_count', p_offline_alert_count,
    'triggered_rules', to_jsonb(p_triggered_rules),
    'last_rule_id', p_last_rule_id
  )
  WHERE id = p_device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;