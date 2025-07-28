-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar execução da Edge Function a cada minuto
SELECT cron.schedule(
  'campaign-scheduler-every-minute',
  '* * * * *', -- A cada minuto
  $$
  SELECT
    net.http_post(
        url:='https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/campaign-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Adicionar novos status às campanhas avançadas se não existir constraint
DO $$ 
BEGIN
  -- Verificar se a constraint existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'campaigns_advanced_status_check'
  ) THEN
    -- Adicionar constraint com novos status
    ALTER TABLE campaigns_advanced 
    ADD CONSTRAINT campaigns_advanced_status_check 
    CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'expired', 'cancelled'));
  END IF;
END $$;