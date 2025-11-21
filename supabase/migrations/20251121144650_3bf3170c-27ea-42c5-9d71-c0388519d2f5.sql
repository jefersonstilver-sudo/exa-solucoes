-- Atualizar API Key do ManyChat para Eduardo
-- IMPORTANTE: Substituir 'SUA_NOVA_API_KEY_MANYCHAT' pela API key real gerada no ManyChat

UPDATE agents
SET manychat_config = jsonb_build_object(
  'api_key', 'SUA_NOVA_API_KEY_MANYCHAT',  -- <<< SUBSTITUIR AQUI
  'webhook_url', COALESCE(manychat_config->>'webhook_url', '')
)
WHERE key = 'eduardo';

-- Verificar se foi atualizado
SELECT key, display_name, manychat_config
FROM agents
WHERE key = 'eduardo';