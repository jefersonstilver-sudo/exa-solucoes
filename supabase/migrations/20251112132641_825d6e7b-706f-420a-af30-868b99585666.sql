-- Corrigir ordem de operações em safe_set_base_video
-- Marca novo PRIMEIRO, depois desmarca antigos (evita trigger CANNOT_REMOVE_LAST_BASE_VIDEO)

DROP FUNCTION IF EXISTS safe_set_base_video(uuid);

CREATE FUNCTION safe_set_base_video(p_slot_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_pedido_id uuid;
  v_video_id uuid;
  v_affected_rows int;
  v_result jsonb;
BEGIN
  -- Buscar informações do slot
  SELECT pedido_id, video_id INTO v_pedido_id, v_video_id
  FROM public.pedido_videos
  WHERE id = p_slot_id;

  IF v_pedido_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Slot não encontrado'
    );
  END IF;

  IF v_video_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Slot não possui vídeo associado'
    );
  END IF;

  -- ✅ ORDEM CORRETA: Ativar novo vídeo base PRIMEIRO (evita trigger de proteção)
  UPDATE public.pedido_videos
  SET 
    is_base_video = true,
    is_active = true,
    selected_for_display = true,
    updated_at = now()
  WHERE id = p_slot_id;

  -- ✅ DEPOIS: Desmarcar outros vídeos base do mesmo pedido
  UPDATE public.pedido_videos
  SET 
    is_base_video = false,
    updated_at = now()
  WHERE pedido_id = v_pedido_id
    AND is_base_video = true
    AND id != p_slot_id;

  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;

  -- Validação final de consistência
  IF NOT EXISTS (
    SELECT 1 FROM public.pedido_videos 
    WHERE id = p_slot_id 
      AND is_base_video = true 
      AND is_active = true 
      AND selected_for_display = true
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Falha ao garantir consistência do vídeo base'
    );
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Vídeo base definido com sucesso',
    'slot_id', p_slot_id,
    'pedido_id', v_pedido_id,
    'video_id', v_video_id,
    'previous_base_deactivated', v_affected_rows
  );

  RETURN v_result;
END;
$$;