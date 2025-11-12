-- Fix activate_scheduled_video to not attempt to deactivate base video
-- The trigger protect_base_video_flag prevents direct modification of base video

CREATE OR REPLACE FUNCTION public.activate_scheduled_video(p_video_id UUID, p_pedido_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_affected_rows INT;
  v_base_video_id UUID;
BEGIN
  -- Get the base video ID for this pedido
  SELECT video_id INTO v_base_video_id
  FROM pedido_videos
  WHERE pedido_id = p_pedido_id
    AND is_base_video = true
  LIMIT 1;
  
  -- First: Deactivate all NON-BASE videos in the pedido
  UPDATE pedido_videos
  SET 
    is_active = false,
    selected_for_display = false,
    updated_at = now()
  WHERE pedido_id = p_pedido_id
    AND is_base_video = false;
  
  -- Second: Deactivate the base video ONLY by setting selected_for_display
  -- (is_active stays true for base video as per business rules)
  UPDATE pedido_videos
  SET 
    selected_for_display = false,
    updated_at = now()
  WHERE pedido_id = p_pedido_id
    AND is_base_video = true;
  
  -- Third: Activate the scheduled video
  UPDATE pedido_videos
  SET 
    is_active = true,
    selected_for_display = true,
    updated_at = now()
  WHERE video_id = p_video_id
    AND pedido_id = p_pedido_id
    AND approval_status = 'approved';
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  
  -- Check if the video was activated
  IF v_affected_rows = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Vídeo não encontrado ou não está aprovado',
      'video_id', p_video_id,
      'pedido_id', p_pedido_id
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Vídeo agendado ativado com sucesso',
    'video_id', p_video_id,
    'pedido_id', p_pedido_id,
    'base_video_id', v_base_video_id,
    'affected_rows', v_affected_rows
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_detail', SQLSTATE,
    'video_id', p_video_id,
    'pedido_id', p_pedido_id
  );
END;
$$;