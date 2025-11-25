-- ===================================================
-- MIGRAÇÃO: Sistema de Monitoramento Automático 24/7
-- ===================================================

-- 1. Adicionar coluna is_active na tabela devices
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Marcar todos dispositivos existentes como ativos
UPDATE devices SET is_active = TRUE WHERE is_active IS NULL;

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_devices_is_active ON devices(is_active);

-- 2. Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Remover cron jobs existentes (se houver)
SELECT cron.unschedule('sync-anydesk-auto') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-anydesk-auto');
SELECT cron.unschedule('monitor-panels-auto') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monitor-panels-auto');

-- 4. Criar cron job para sync-anydesk (a cada minuto)
SELECT cron.schedule(
  'sync-anydesk-auto',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/sync-anydesk',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk"}'::jsonb,
    body := concat('{"triggered_by": "cron", "timestamp": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- 5. Criar cron job para monitor-panels (a cada minuto)
SELECT cron.schedule(
  'monitor-panels-auto',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/monitor-panels',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk"}'::jsonb,
    body := concat('{"triggered_by": "cron", "timestamp": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

-- 6. Verificar cron jobs criados
SELECT jobname, schedule, command 
FROM cron.job 
WHERE jobname IN ('sync-anydesk-auto', 'monitor-panels-auto');

-- 7. Comentário de conclusão
COMMENT ON COLUMN devices.is_active IS 'Indica se o dispositivo está ativo no sistema de monitoramento';
