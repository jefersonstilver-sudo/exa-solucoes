-- Configurar cron job para executar video-status-updater a cada minuto
-- Requer extensões pg_cron e pg_net já habilitadas no Supabase

-- Habilitar extensões necessárias (se ainda não estiverem)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remover job existente se houver (para evitar duplicatas)
SELECT cron.unschedule('video-status-updater-job')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'video-status-updater-job'
);

-- Criar cron job que executa a cada minuto
SELECT cron.schedule(
  'video-status-updater-job',
  '* * * * *', -- Todo minuto
  $$
  SELECT
    net.http_post(
      url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/video-status-updater',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk"}'::jsonb,
      body := concat('{"triggered_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);