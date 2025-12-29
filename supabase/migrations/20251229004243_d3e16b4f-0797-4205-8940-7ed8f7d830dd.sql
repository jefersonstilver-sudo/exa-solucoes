-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar sincronização do Notion a cada 10 minutos
SELECT cron.schedule(
  'sync-notion-every-10min',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/sync-notion-buildings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk'
    ),
    body := jsonb_build_object('triggered_by', 'cron', 'timestamp', now())
  ) as request_id;
  $$
);

-- Agendar sincronização de status dos painéis AnyDesk a cada 5 minutos
SELECT cron.schedule(
  'sync-anydesk-status-every-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/sync-device-building-status',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk'
    ),
    body := jsonb_build_object('triggered_by', 'cron', 'timestamp', now())
  ) as request_id;
  $$
);