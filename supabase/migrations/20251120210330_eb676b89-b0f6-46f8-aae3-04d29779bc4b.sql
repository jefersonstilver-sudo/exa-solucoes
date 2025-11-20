-- Configuração completa do agente Sofia com credenciais Z-API corretas
-- Este script atualiza a Sofia com os valores corretos das imagens fornecidas

-- Atualizar configuração Z-API da Sofia
UPDATE agents 
SET 
  zapi_config = jsonb_build_object(
    'instance_id', '3EA840367A03C19568E61E9814A1DE6D',
    'token', 'AF7014E331130E925B7353CF',
    'client_token', 'E29F7B3C2D7E4C1A9B6F8D5E3A7C9B4F',
    'api_url', 'https://api.z-api.io',
    'webhook_url', '/functions/v1/zapi-webhook',
    'status', 'connected'
  ),
  ai_auto_response = true,
  whatsapp_provider = 'zapi'
WHERE key = 'sofia';

-- Log da atualização
INSERT INTO agent_logs (agent_key, event_type, metadata)
VALUES (
  'sofia',
  'configuration_updated',
  jsonb_build_object(
    'updated_at', NOW(),
    'changes', jsonb_build_object(
      'zapi_config_updated', true,
      'ai_auto_response_enabled', true,
      'whatsapp_provider', 'zapi'
    ),
    'note', 'Configuração Z-API completa implementada com credenciais corretas'
  )
);