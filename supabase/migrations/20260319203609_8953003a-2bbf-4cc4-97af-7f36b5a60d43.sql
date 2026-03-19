UPDATE exa_alerts_config 
SET config_value = '{"ativo": true, "minutos_apos": 30}'::jsonb
WHERE config_key = 'agenda_followup_pos_evento';