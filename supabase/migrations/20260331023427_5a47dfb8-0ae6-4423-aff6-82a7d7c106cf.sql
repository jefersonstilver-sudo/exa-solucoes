-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA cron;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Create the cron job to invoke task-reminder-scheduler every 2 minutes
SELECT cron.schedule(
  'task-reminder-scheduler-cron',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url:='https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/task-reminder-scheduler',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);