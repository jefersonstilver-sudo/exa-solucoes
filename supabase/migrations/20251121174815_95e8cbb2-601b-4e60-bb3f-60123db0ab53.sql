-- Corrigir API Key do ManyChat para Eduardo (chave começa com 'i' não '1')
UPDATE agents
SET manychat_config = jsonb_build_object(
  'api_key', 'i663612:ebed5ddc23678d0944c1acb2',
  'webhook_url', 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/webhook-manychat/eduardo'
)
WHERE key = 'eduardo';