CREATE OR REPLACE FUNCTION public.safe_set_base_video(p_slot_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido_id UUID;
  v_video_name TEXT;
  v_video_id UUID;
  v_slot_position INTEGER;
  v_schedules_removed INTEGER := 0;
BEGIN
  PERFORM set_config('app.in_rpc_context', 'true', true);

  SELECT pv.pedido_id, v.nome, pv.video_id, pv.slot_position
  INTO v_pedido_id, v_video_name, v_video_id, v_slot_position
  FROM pedido_videos pv
  JOIN videos v ON v.id = pv.video_id
  WHERE pv.id = p_slot_id;

  IF v_pedido_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Slot não encontrado');
  END IF;

  -- Desmarcar todos os outros vídeos do pedido
  UPDATE public.pedido_videos
  SET is_base_video = false, selected_for_display = false, is_active = false, updated_at = now()
  WHERE pedido_id = v_pedido_id AND id != p_slot_id;

  -- Marcar este como master
  UPDATE public.pedido_videos
  SET is_base_video = true, selected_for_display = true, is_active = true,
      approval_status = 'approved',
      approved_at = COALESCE(approved_at, now()),
      updated_at = now()
  WHERE id = p_slot_id;

  -- ⭐ NOVO: Limpar a programação do novo master (master não tem programação)
  WITH affected AS (
    UPDATE public.campaign_schedule_rules r
    SET is_active = false, updated_at = now()
    FROM public.campaign_video_schedules s
    WHERE r.campaign_video_schedule_id = s.id
      AND s.video_id = v_video_id
      AND s.slot_position = v_slot_position
      AND r.is_active = true
    RETURNING r.id
  )
  SELECT count(*) INTO v_schedules_removed FROM affected;

  PERFORM set_config('app.in_rpc_context', 'false', true);

  RETURN json_build_object(
    'success', true,
    'video_name', v_video_name,
    'schedules_removed', v_schedules_removed
  );
EXCEPTION
  WHEN OTHERS THEN
    PERFORM set_config('app.in_rpc_context', 'false', true);
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;