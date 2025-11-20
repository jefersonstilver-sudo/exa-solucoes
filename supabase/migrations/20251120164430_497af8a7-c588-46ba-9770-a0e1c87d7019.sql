-- Adicionar campo client_token na configuração zapi_config
COMMENT ON COLUMN agents.zapi_config IS 'Configuração Z-API: instance_id, token, api_url, webhook_url, status, client_token (token de segurança da conta)';

-- Atualizar zapi_config da Sofia para incluir um placeholder para o client_token
-- O usuário precisará configurar manualmente na interface