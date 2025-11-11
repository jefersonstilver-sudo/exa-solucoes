-- Fix all table references in select_video_for_display to use explicit public schema
-- This resolves the "relation pedido_videos does not exist" error

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
  -- Get pedido_id and video_id (with explicit schema prefix)
  SELECT pedido_id, video_id, is_base_video 
  INTO v_pedido_id, v_video_id, v_is_base_video
  FROM public.pedido_videos
  WHERE id = p_pedido_video_id;

  IF v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Pedido video not found';
  END IF;

  -- Check for schedule conflicts with other videos (with explicit schema prefix)
  FOR v_other_video IN 
    SELECT id, video_id, is_base_video
    FROM public.pedido_videos
    WHERE pedido_id = v_pedido_id 
      AND id != p_pedido_video_id
      AND video_id IS NOT NULL
      AND selected_for_display = true
  LOOP
    -- Use explicit schema prefix for function calls
    IF public.check_video_schedule_conflict(v_video_id, v_other_video.video_id) THEN
      RAISE EXCEPTION 'Schedule conflict detected with video %', v_other_video.video_id;
    END IF;
  END LOOP;

  -- Deselect all other videos in the same pedido (with explicit schema prefix)
  UPDATE public.pedido_videos
  SET selected_for_display = false,
      updated_at = now()
  WHERE pedido_id = v_pedido_id 
    AND id != p_pedido_video_id
    AND selected_for_display = true;

  -- Select the target video (with explicit schema prefix)
  UPDATE public.pedido_videos
  SET selected_for_display = true,
      updated_at = now()
  WHERE id = p_pedido_video_id;

  RETURN true;
END;
$$;