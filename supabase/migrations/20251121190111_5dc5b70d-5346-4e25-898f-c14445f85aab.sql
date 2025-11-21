-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para sincronização automática do ManyChat
-- Executa a cada 1 minuto, mas a edge function decide quais agentes sincronizar
SELECT cron.schedule(
  'manychat-auto-sync',
  '* * * * *', -- A cada 1 minuto
  $$
  SELECT net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/manychat-auto-sync-cron',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk"}'::jsonb,
    body := concat('{"timestamp": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);