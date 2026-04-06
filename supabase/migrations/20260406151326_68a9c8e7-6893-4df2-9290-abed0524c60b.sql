
-- Trigger: auto-approve videos for master orders
CREATE OR REPLACE FUNCTION public.auto_approve_master_video()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the pedido is master, force approval_status to 'approved'
  IF EXISTS (
    SELECT 1 FROM public.pedidos
    WHERE id = NEW.pedido_id AND is_master = true
  ) THEN
    NEW.approval_status := 'approved';
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_auto_approve_master_video ON public.pedido_videos;

-- Create trigger on INSERT and UPDATE
CREATE TRIGGER trg_auto_approve_master_video
  BEFORE INSERT OR UPDATE ON public.pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_master_video();
