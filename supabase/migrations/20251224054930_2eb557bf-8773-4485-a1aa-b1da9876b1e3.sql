-- Configurações para cards do dashboard
INSERT INTO exa_alerts_config (config_key, config_value, descricao)
VALUES 
  ('dashboard_proposals_expiring_days', '{"value": 3}', 'Dias para alerta de propostas expirando'),
  ('dashboard_conversations_timeout_minutes', '{"value": 3}', 'Minutos para conversa sem resposta'),
  ('dashboard_contracts_expiring_days', '{"value": 7}', 'Dias para alerta de contratos expirando')
ON CONFLICT (config_key) DO NOTHING;