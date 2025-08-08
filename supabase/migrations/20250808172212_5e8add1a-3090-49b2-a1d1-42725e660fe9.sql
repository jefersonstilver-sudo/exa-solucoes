-- Harden function by setting security definer and search_path
CREATE OR REPLACE FUNCTION public.pv_auto_select_on_approval()
RETURNS trigger AS $$
DECLARE
  has_selected boolean;
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.approval_status = 'approved' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.pedido_videos
      WHERE pedido_id = NEW.pedido_id AND selected_for_display = true
    ) INTO has_selected;

    IF NOT has_selected THEN
      NEW.selected_for_display := true;
      NEW.is_active := COALESCE(NEW.is_active, true);
      IF NEW.approved_at IS NULL THEN
        NEW.approved_at := now();
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;