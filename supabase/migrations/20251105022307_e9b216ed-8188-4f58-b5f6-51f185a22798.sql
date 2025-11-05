-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unschedule existing job if it exists (ignore errors if doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('update-platform-metrics-hourly');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Schedule the update-platform-metrics function to run every hour
SELECT cron.schedule(
  'update-platform-metrics-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url:='https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/update-platform-metrics',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk2OTAyMzcsImV4cCI6MjA0NTI2NjIzN30.DxPTW8IgOwRBUw5jE5JQqiugkOEiVlv07hW_rIxjdNo"}'::jsonb,
      body:=concat('{"scheduled_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create a table to log cron job executions (optional, for monitoring)
CREATE TABLE IF NOT EXISTS public.cron_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT,
  details JSONB
);

-- Enable RLS on cron_job_logs
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to cron logs
CREATE POLICY "Admins can view cron logs"
  ON public.cron_job_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
);