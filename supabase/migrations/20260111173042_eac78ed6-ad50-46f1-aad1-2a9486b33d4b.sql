-- CRON diário para sincronização ASAAS às 07:00 BRT (10:00 UTC)
SELECT cron.schedule(
  'sync-asaas-transactions-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/sync-asaas-transactions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);