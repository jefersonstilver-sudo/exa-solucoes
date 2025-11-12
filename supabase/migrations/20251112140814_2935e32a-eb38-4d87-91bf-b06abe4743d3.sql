-- Corrigir safe_set_base_video adicionando flags de contexto RPC para bypassar triggers
CREATE OR REPLACE FUNCTION public.safe_set_base_video(p_slot_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- ⭐ CRITICAL: Definir flag de contexto RPC para bypassar triggers de validação
  PERFORM set_config('app.in_rpc_context', 'true', true);

  -- ✅ ORDEM CORRETA: PRIMEIRO desmarcar todos os outros vídeos base
  UPDATE public.pedido_videos
  SET 
    is_base_video = false,
    updated_at = now()
  WHERE pedido_id = v_pedido_id
    AND is_base_video = true
    AND id != p_slot_id;

  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;

  -- ✅ DEPOIS: Marcar o novo vídeo como base
  UPDATE public.pedido_videos
  SET 
    is_base_video = true,
    is_active = true,
    selected_for_display = true,
    updated_at = now()
  WHERE id = p_slot_id;

  -- ⭐ CRITICAL: Resetar flag de contexto RPC
  PERFORM set_config('app.in_rpc_context', 'false', true);

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

COMMENT ON FUNCTION public.safe_set_base_video IS 'Define um slot como vídeo base principal usando flag app.in_rpc_context para bypassar triggers de validação durante a troca atômica.';