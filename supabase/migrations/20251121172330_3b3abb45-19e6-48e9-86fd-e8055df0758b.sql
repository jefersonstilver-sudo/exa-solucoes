-- Atualizar API Key do ManyChat para Eduardo
UPDATE agents
SET manychat_config = jsonb_build_object(
  'api_key', '1663612:ebed5ddc23678d0944c1acb2',
  'webhook_url', COALESCE(manychat_config->>'webhook_url', 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/webhook-manychat/eduardo')
)
WHERE key = 'eduardo';

-- Verificar se foi atualizado
SELECT key, display_name, manychat_config
FROM agents
WHERE key = 'eduardo';