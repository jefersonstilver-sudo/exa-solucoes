-- Update RPC function to support offline_started_at and notified_back_online fields
CREATE OR REPLACE FUNCTION update_device_alert_metadata(
  p_device_id UUID,
  p_last_offline_alert_at TIMESTAMPTZ,
  p_offline_alert_count INTEGER,
  p_triggered_rules TEXT[],
  p_last_rule_id UUID,
  p_offline_started_at TIMESTAMPTZ DEFAULT NULL,
  p_notified_back_online BOOLEAN DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE devices
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'last_offline_alert_at', p_last_offline_alert_at,
    'offline_alert_count', p_offline_alert_count,
    'triggered_rules', to_jsonb(p_triggered_rules),
    'last_rule_id', p_last_rule_id,
    'offline_started_at', p_offline_started_at,
    'notified_back_online', p_notified_back_online
  )
  WHERE id = p_device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;