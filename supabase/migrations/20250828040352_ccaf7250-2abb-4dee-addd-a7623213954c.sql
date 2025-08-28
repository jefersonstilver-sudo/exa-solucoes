-- 1) Remover índice duplicado (se existir) que causa conflito
DROP INDEX IF EXISTS public.ux_pedido_videos_one_selected;

-- 2) Garantir índices únicos consistentes por pedido
-- Um único selecionado_para_exibicao por pedido
CREATE UNIQUE INDEX IF NOT EXISTS idx_pv_one_selected_per_order
ON public.pedido_videos (pedido_id)
WHERE selected_for_display = true;

-- Um único video_base por pedido
CREATE UNIQUE INDEX IF NOT EXISTS idx_pv_one_base_per_order
ON public.pedido_videos (pedido_id)
WHERE is_base_video = true;

-- 3) Padronizar triggers para evitar corridas e chaves duplicadas
-- 3.1) Garantir apenas um selecionado por pedido (AFTER INSERT/UPDATE de selected_for_display)
DROP TRIGGER IF EXISTS pv_ensure_only_one_selected_trg ON public.pedido_videos;
DROP TRIGGER IF EXISTS trg_pv_ensure_only_one_selected ON public.pedido_videos;
CREATE TRIGGER pv_ensure_only_one_selected_trg
AFTER INSERT OR UPDATE OF selected_for_display
ON public.pedido_videos
FOR EACH ROW
EXECUTE FUNCTION public.pv_ensure_only_one_selected();

-- 3.2) Auto selecionar quando vídeo aprovado (BEFORE INSERT/UPDATE de approval_status)
DROP TRIGGER IF EXISTS pv_auto_select_on_approval_trg ON public.pedido_videos;
DROP TRIGGER IF EXISTS trg_pv_auto_select_on_approval ON public.pedido_videos;
CREATE TRIGGER pv_auto_select_on_approval_trg
BEFORE INSERT OR UPDATE OF approval_status
ON public.pedido_videos
FOR EACH ROW
EXECUTE FUNCTION public.pv_auto_select_on_approval();

-- 3.3) Impedir remoção inválida (apenas em DELETE)
DROP TRIGGER IF EXISTS prevent_last_video_removal_trg ON public.pedido_videos;
DROP TRIGGER IF EXISTS trg_pv_never_empty_when_approved ON public.pedido_videos;
DROP TRIGGER IF EXISTS pv_never_empty_when_approved_trg ON public.pedido_videos;
DROP TRIGGER IF EXISTS prevent_base_video_removal_trg ON public.pedido_videos;
CREATE TRIGGER prevent_last_video_removal_trg
AFTER DELETE ON public.pedido_videos
FOR EACH ROW
EXECUTE FUNCTION public.prevent_last_video_removal();
CREATE TRIGGER prevent_base_video_removal_trg
AFTER DELETE ON public.pedido_videos
FOR EACH ROW
EXECUTE FUNCTION public.prevent_base_video_removal();

-- 4) Função transacional para trocar vídeo principal com lock e consistência
CREATE OR REPLACE FUNCTION public.set_base_video_enhanced(p_pedido_video_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pedido_id uuid;
  v_status text;
  v_video_id uuid;
BEGIN
  -- Validar slot e status aprovado + lock da linha alvo
  SELECT pedido_id, approval_status, video_id
  INTO v_pedido_id, v_status, v_video_id
  FROM public.pedido_videos
  WHERE id = p_pedido_video_id
  FOR UPDATE;

  IF v_pedido_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'slot_not_found');
  END IF;
  IF v_status <> 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_approved');
  END IF;

  -- Lock de todas as linhas do mesmo pedido para evitar corridas
  PERFORM 1 FROM public.pedido_videos WHERE pedido_id = v_pedido_id FOR UPDATE;

  -- Desmarcar/Desativar outros vídeos desse pedido
  UPDATE public.pedido_videos
  SET selected_for_display = false,
      is_base_video = false,
      is_active = false,
      updated_at = now()
  WHERE pedido_id = v_pedido_id
    AND id <> p_pedido_video_id
    AND (selected_for_display = true OR is_base_video = true OR is_active = true);

  -- Marcar o novo vídeo como base, selecionado e ativo
  UPDATE public.pedido_videos
  SET selected_for_display = true,
      is_base_video = true,
      is_active = true,
      updated_at = now()
  WHERE id = p_pedido_video_id;

  RETURN jsonb_build_object('success', true, 'pedido_id', v_pedido_id, 'video_id', v_video_id);
END;
$$;