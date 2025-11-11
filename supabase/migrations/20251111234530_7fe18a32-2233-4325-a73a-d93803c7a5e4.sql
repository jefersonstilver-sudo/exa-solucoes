-- Fix select_video_for_display to use explicit schema prefix for check_video_schedule_conflict
-- This resolves the "function check_video_schedule_conflict(uuid, uuid) does not exist" error

CREATE OR REPLACE FUNCTION public.select_video_for_display(p_pedido_video_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_pedido_id UUID;
  v_video_id UUID;
  v_is_base_video BOOLEAN;
  v_other_video RECORD;
BEGIN
  -- Get pedido_id and video_id
  SELECT pedido_id, video_id, is_base_video 
  INTO v_pedido_id, v_video_id, v_is_base_video
  FROM public.pedido_videos
  WHERE id = p_pedido_video_id;

  IF v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Pedido video not found';
  END IF;

  -- Check for schedule conflicts with other videos
  FOR v_other_video IN 
    SELECT id, video_id, is_base_video
    FROM public.pedido_videos
    WHERE pedido_id = v_pedido_id 
      AND id != p_pedido_video_id
      AND video_id IS NOT NULL
      AND selected_for_display = true
  LOOP
    -- Use explicit schema prefix to avoid search_path issues
    IF public.check_video_schedule_conflict(v_video_id, v_other_video.video_id) THEN
      RAISE EXCEPTION 'Schedule conflict detected with video %', v_other_video.video_id;
    END IF;
  END LOOP;

  -- Deselect all other videos in the same pedido
  UPDATE public.pedido_videos
  SET selected_for_display = false,
      updated_at = now()
  WHERE pedido_id = v_pedido_id 
    AND id != p_pedido_video_id
    AND selected_for_display = true;

  -- Select the target video
  UPDATE public.pedido_videos
  SET selected_for_display = true,
      updated_at = now()
  WHERE id = p_pedido_video_id;

  RETURN true;
END;
$$;