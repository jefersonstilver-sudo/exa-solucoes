-- Enforce single selected_for_display video per pedido and repair legacy duplicates
-- 1) Unique partial index: only one selected_for_display per pedido
CREATE UNIQUE INDEX IF NOT EXISTS ux_pedido_videos_one_selected
ON public.pedido_videos (pedido_id)
WHERE selected_for_display = true;

-- 2) Ensure triggers are installed correctly
-- Auto-select on approval (BEFORE)
DROP TRIGGER IF EXISTS pv_auto_select_on_approval_trg ON public.pedido_videos;
CREATE TRIGGER pv_auto_select_on_approval_trg
BEFORE INSERT OR UPDATE OF approval_status
ON public.pedido_videos
FOR EACH ROW
EXECUTE FUNCTION public.pv_auto_select_on_approval();

-- Ensure only one selected (AFTER)
DROP TRIGGER IF EXISTS pv_ensure_only_one_selected_trg ON public.pedido_videos;
CREATE TRIGGER pv_ensure_only_one_selected_trg
AFTER INSERT OR UPDATE OF selected_for_display
ON public.pedido_videos
FOR EACH ROW
EXECUTE FUNCTION public.pv_ensure_only_one_selected();

-- Never empty when there are approved videos (AFTER on all row changes)
DROP TRIGGER IF EXISTS pv_never_empty_when_approved_trg ON public.pedido_videos;
CREATE TRIGGER pv_never_empty_when_approved_trg
AFTER INSERT OR UPDATE OR DELETE ON public.pedido_videos
FOR EACH ROW
EXECUTE FUNCTION public.pv_never_empty_when_approved();

-- 3) Data repair: unselect duplicates, ensure one selection per pedido, and ensure base
-- 3.1 Unselect duplicates, keep most recent approved/updated/created as selected
WITH ranked AS (
  SELECT
    id,
    pedido_id,
    ROW_NUMBER() OVER (
      PARTITION BY pedido_id
      ORDER BY approved_at DESC NULLS LAST, updated_at DESC, created_at DESC
    ) AS rn
  FROM public.pedido_videos
  WHERE selected_for_display = true
),
updated_unselected AS (
  UPDATE public.pedido_videos pv
  SET selected_for_display = false,
      is_active = false,
      updated_at = now()
  WHERE pv.id IN (SELECT id FROM ranked WHERE rn > 1)
  RETURNING 1
)
SELECT 1;

-- 3.2 If there are approved videos but none selected, select the most recent approved
WITH pedidos_missing AS (
  SELECT p.id AS pedido_id
  FROM public.pedidos p
  WHERE EXISTS (
          SELECT 1 FROM public.pedido_videos pv
          WHERE pv.pedido_id = p.id AND pv.approval_status = 'approved'
        )
    AND NOT EXISTS (
          SELECT 1 FROM public.pedido_videos pv
          WHERE pv.pedido_id = p.id AND pv.selected_for_display = true
        )
),
chosen AS (
  SELECT DISTINCT ON (pv.pedido_id) pv.id
  FROM public.pedido_videos pv
  JOIN pedidos_missing pm ON pm.pedido_id = pv.pedido_id
  WHERE pv.approval_status = 'approved'
  ORDER BY pv.pedido_id, pv.approved_at DESC NULLS LAST, pv.updated_at DESC, pv.created_at DESC
),
updated_selected AS (
  UPDATE public.pedido_videos pv
  SET selected_for_display = true,
      is_active = true,
      updated_at = now()
  WHERE pv.id IN (SELECT id FROM chosen)
  RETURNING 1
)
SELECT 1;

-- 3.3 If no base video exists for a pedido, set current selected as base
WITH needs_base AS (
  SELECT pv.pedido_id, pv.id
  FROM public.pedido_videos pv
  WHERE pv.selected_for_display = true
    AND NOT EXISTS (
      SELECT 1 FROM public.pedido_videos x
      WHERE x.pedido_id = pv.pedido_id AND x.is_base_video = true
    )
),
updated_base AS (
  UPDATE public.pedido_videos pv
  SET is_base_video = true,
      updated_at = now()
  FROM needs_base nb
  WHERE pv.id = nb.id
  RETURNING 1
)
SELECT 1;

-- 4) Log action
INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
VALUES (
  'DATA_FIX_ENFORCE_SINGLE_SELECTED',
  'Applied unique index on selected_for_display per pedido, reinstalled triggers, repaired duplicates and ensured base video'
);