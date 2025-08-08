-- Ensure exactly one video selected_for_display per pedido and auto-manage selection on approval

-- 1) Unique partial index: at most one selected_for_display per pedido
CREATE UNIQUE INDEX IF NOT EXISTS idx_pedido_videos_one_selected
  ON public.pedido_videos (pedido_id)
  WHERE selected_for_display = true;

-- 2) CHECK: selected_for_display only allowed when approved
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_selected_requires_approved'
  ) THEN
    ALTER TABLE public.pedido_videos
      ADD CONSTRAINT chk_selected_requires_approved
      CHECK (NOT selected_for_display OR approval_status = 'approved');
  END IF;
END $$;

-- 3) BEFORE trigger: when a video gets approved and none is selected, auto-select it
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pv_auto_select_on_approval ON public.pedido_videos;
CREATE TRIGGER trg_pv_auto_select_on_approval
BEFORE INSERT OR UPDATE ON public.pedido_videos
FOR EACH ROW EXECUTE FUNCTION public.pv_auto_select_on_approval();

-- 4) AFTER trigger: ensure only one selected by unselecting others if needed
CREATE OR REPLACE FUNCTION public.pv_ensure_only_one_selected()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.selected_for_display = true THEN
    UPDATE public.pedido_videos
    SET selected_for_display = false
    WHERE pedido_id = NEW.pedido_id AND id <> NEW.id AND selected_for_display = true;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_pv_ensure_only_one_selected ON public.pedido_videos;
CREATE TRIGGER trg_pv_ensure_only_one_selected
AFTER INSERT OR UPDATE ON public.pedido_videos
FOR EACH ROW EXECUTE FUNCTION public.pv_ensure_only_one_selected();

-- 5) AFTER trigger: never allow zero selected when there are approved videos for the pedido
CREATE OR REPLACE FUNCTION public.pv_never_empty_when_approved()
RETURNS trigger AS $$
DECLARE
  v_pedido uuid;
  has_selected boolean;
  has_approved boolean;
  chosen uuid;
BEGIN
  v_pedido := COALESCE(NEW.pedido_id, OLD.pedido_id);

  SELECT EXISTS(
    SELECT 1 FROM public.pedido_videos WHERE pedido_id = v_pedido AND selected_for_display = true
  ) INTO has_selected;

  SELECT EXISTS(
    SELECT 1 FROM public.pedido_videos WHERE pedido_id = v_pedido AND approval_status = 'approved'
  ) INTO has_approved;

  IF has_approved AND NOT has_selected THEN
    SELECT id INTO chosen FROM public.pedido_videos
    WHERE pedido_id = v_pedido AND approval_status = 'approved'
    ORDER BY approved_at DESC NULLS LAST, updated_at DESC, created_at DESC
    LIMIT 1;

    IF chosen IS NOT NULL THEN
      UPDATE public.pedido_videos
      SET selected_for_display = true, is_active = true
      WHERE id = chosen;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_pv_never_empty_when_approved ON public.pedido_videos;
CREATE TRIGGER trg_pv_never_empty_when_approved
AFTER INSERT OR UPDATE OR DELETE ON public.pedido_videos
FOR EACH ROW EXECUTE FUNCTION public.pv_never_empty_when_approved();