ALTER TABLE public.api_sync_logs DROP CONSTRAINT IF EXISTS api_sync_logs_action_check;
ALTER TABLE public.api_sync_logs ADD CONSTRAINT api_sync_logs_action_check CHECK (action = ANY (ARRAY['add','remove','audit','reconcile_video_master','master_update','master_auto_sync','master_daily_check']));
ALTER TABLE public.api_sync_logs DROP CONSTRAINT IF EXISTS api_sync_logs_source_check;
ALTER TABLE public.api_sync_logs ADD CONSTRAINT api_sync_logs_source_check CHECK (char_length(source) BETWEEN 1 AND 80);
ALTER TABLE public.api_sync_logs DROP CONSTRAINT IF EXISTS api_sync_logs_status_check;
ALTER TABLE public.api_sync_logs ADD CONSTRAINT api_sync_logs_status_check CHECK (status = ANY (ARRAY['success','error','skipped','warning','pending']));

CREATE OR REPLACE FUNCTION public.notify_master_video_aws_sync(p_pedido_id uuid, p_pedido_video_id uuid, p_reason text, p_previous_title text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/sync-master-video-aws',
    headers := jsonb_build_object('Content-Type','application/json',
      'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha2Vub2xqc3ljeXJjcmNoZ3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDM3NTUsImV4cCI6MjA2MjQ3OTc1NX0.wEKVfJKfQiybyne0yn0dOUwbujb_WXkZHAzlyfHb0lk'),
    body := jsonb_build_object('pedido_id', p_pedido_id, 'pedido_video_id', p_pedido_video_id, 'reason', p_reason, 'previous_title', p_previous_title)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_master_video_aws_sync failed: %', SQLERRM;
END $$;
REVOKE ALL ON FUNCTION public.notify_master_video_aws_sync(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_master_video_aws_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_reason text;
BEGIN
  IF NEW.approval_status IS DISTINCT FROM 'approved' THEN RETURN NEW; END IF;
  IF NOT EXISTS (SELECT 1 FROM pedidos WHERE id = NEW.pedido_id AND is_master = true) THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    v_reason := 'inserted';
  ELSIF OLD.approval_status IS DISTINCT FROM 'approved' THEN
    v_reason := 'approved';
  ELSIF (NEW.is_base_video AND NOT COALESCE(OLD.is_base_video,false))
     OR (COALESCE(NEW.selected_for_display,false) AND NOT COALESCE(OLD.selected_for_display,false))
     OR (COALESCE(NEW.is_active,false) AND NOT COALESCE(OLD.is_active,false) AND (NEW.is_base_video OR COALESCE(NEW.selected_for_display,false))) THEN
    v_reason := 'became_base';
  ELSE
    RETURN NEW;
  END IF;
  PERFORM public.notify_master_video_aws_sync(NEW.pedido_id, NEW.id, v_reason, NULL);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_master_video_aws_sync ON public.pedido_videos;
CREATE TRIGGER trg_master_video_aws_sync
AFTER INSERT OR UPDATE OF approval_status, is_base_video, is_active, selected_for_display ON public.pedido_videos
FOR EACH ROW EXECUTE FUNCTION public.trg_master_video_aws_sync();

CREATE OR REPLACE FUNCTION public.trg_master_video_rename_aws_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NEW.nome IS NOT DISTINCT FROM OLD.nome THEN RETURN NEW; END IF;
  FOR r IN SELECT pv.id, pv.pedido_id FROM pedido_videos pv JOIN pedidos p ON p.id = pv.pedido_id
           WHERE pv.video_id = NEW.id AND pv.approval_status = 'approved' AND p.is_master = true LOOP
    PERFORM public.notify_master_video_aws_sync(r.pedido_id, r.id, 'renamed', OLD.nome);
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_master_video_rename_aws_sync ON public.videos;
CREATE TRIGGER trg_master_video_rename_aws_sync
AFTER UPDATE OF nome ON public.videos
FOR EACH ROW EXECUTE FUNCTION public.trg_master_video_rename_aws_sync();