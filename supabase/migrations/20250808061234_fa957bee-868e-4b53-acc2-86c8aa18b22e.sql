-- Configurar cron job para executar a sincronização de vídeos a cada minuto
SELECT cron.schedule(
  'video-schedule-sync',
  '* * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/video-schedule-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Habilitar realtime para a tabela pedido_videos
ALTER TABLE public.pedido_videos REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.pedido_videos;