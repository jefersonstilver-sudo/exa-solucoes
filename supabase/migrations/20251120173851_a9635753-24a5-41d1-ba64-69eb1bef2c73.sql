-- Atualizar API Key do ManyChat para o agente Eduardo
UPDATE agents 
SET manychat_config = jsonb_build_object(
  'api_key', '1663612:ebed5ddc23678d0944c1acb2768cb653',
  'webhook_url', 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/webhook-manychat/eduardo',
  'status', 'pending'
),
manychat_connected = false
WHERE key = 'eduardo';