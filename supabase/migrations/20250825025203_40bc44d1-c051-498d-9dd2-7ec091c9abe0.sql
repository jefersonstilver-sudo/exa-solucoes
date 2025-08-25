-- Create function to get comprehensive video status
CREATE OR REPLACE FUNCTION public.get_video_current_status(p_video_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_result jsonb;
  v_pedido_video RECORD;
  v_is_displaying boolean := false;
  v_is_scheduled boolean := false;
  v_schedule_active boolean := false;
  v_is_base boolean := false;
  v_is_blocked boolean := false;
  v_current_day integer;
  v_current_time time;
  v_brasilia_time timestamp with time zone;
BEGIN
  -- Get Brasília time
  v_brasilia_time := NOW() AT TIME ZONE 'America/Sao_Paulo';
  v_current_day := EXTRACT(DOW FROM v_brasilia_time);
  v_current_time := v_brasilia_time::time;
  
  -- Get pedido_video info
  SELECT pv.*, p.status as pedido_status
  INTO v_pedido_video
  FROM public.pedido_videos pv
  JOIN public.pedidos p ON p.id = pv.pedido_id
  WHERE pv.video_id = p_video_id
  AND pv.approval_status = 'approved'
  LIMIT 1;
  
  IF v_pedido_video.id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'message', 'Video not found or not approved'
    );
  END IF;
  
  -- Check if video is currently displaying
  v_is_displaying := v_pedido_video.selected_for_display;
  
  -- Check if video is base video
  v_is_base := v_pedido_video.is_base_video;
  
  -- Check if video has active schedules
  SELECT EXISTS (
    SELECT 1
    FROM public.campaign_video_schedules cvs
    JOIN public.campaign_schedule_rules csr ON csr.campaign_video_schedule_id = cvs.id
    JOIN public.campaigns_advanced ca ON ca.id = cvs.campaign_id
    WHERE cvs.video_id = p_video_id
    AND csr.is_active = true
    AND ca.status = 'active'
  ) INTO v_is_scheduled;
  
  -- If has schedules, check if currently active
  IF v_is_scheduled THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.campaign_video_schedules cvs
      JOIN public.campaign_schedule_rules csr ON csr.campaign_video_schedule_id = cvs.id
      JOIN public.campaigns_advanced ca ON ca.id = cvs.campaign_id
      WHERE cvs.video_id = p_video_id
      AND csr.is_active = true
      AND ca.status = 'active'
      AND v_current_day = ANY(csr.days_of_week)
      AND v_current_time BETWEEN csr.start_time AND csr.end_time
    ) INTO v_schedule_active;
  END IF;
  
  -- Check if video is blocked (not active despite being approved)
  v_is_blocked := NOT v_pedido_video.is_active AND v_pedido_video.approval_status = 'approved';
  
  -- Determine primary status
  v_result := jsonb_build_object(
    'video_id', p_video_id,
    'pedido_video_id', v_pedido_video.id,
    'pedido_id', v_pedido_video.pedido_id,
    'is_displaying', v_is_displaying,
    'is_base_video', v_is_base,
    'is_scheduled', v_is_scheduled,
    'schedule_active_now', v_schedule_active,
    'is_blocked', v_is_blocked,
    'is_active', v_pedido_video.is_active,
    'primary_status', CASE
      WHEN v_is_displaying AND (NOT v_is_scheduled OR v_schedule_active) THEN 'displaying'
      WHEN v_is_scheduled AND v_schedule_active THEN 'scheduled_active'
      WHEN v_is_scheduled AND NOT v_schedule_active THEN 'scheduled_inactive'
      WHEN v_is_base THEN 'base'
      WHEN v_is_blocked THEN 'blocked'
      ELSE 'standby'
    END,
    'brasilia_time', v_brasilia_time,
    'current_day', v_current_day,
    'current_time', v_current_time
  );
  
  RETURN v_result;
END;
$function$;

-- Create function to block/unblock video
CREATE OR REPLACE FUNCTION public.admin_block_video(p_pedido_video_id uuid, p_block boolean, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_admin_id uuid;
  v_result jsonb;
BEGIN
  -- Verify admin permissions
  v_admin_id := auth.uid();
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = v_admin_id 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Update video status
  UPDATE public.pedido_videos
  SET 
    is_active = NOT p_block,
    selected_for_display = CASE WHEN p_block THEN false ELSE selected_for_display END,
    updated_at = now()
  WHERE id = p_pedido_video_id;
  
  -- Log the action
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    CASE WHEN p_block THEN 'VIDEO_BLOCKED' ELSE 'VIDEO_UNBLOCKED' END,
    format('Admin %s %s video %s. Reason: %s', 
           v_admin_id, 
           CASE WHEN p_block THEN 'blocked' ELSE 'unblocked' END,
           p_pedido_video_id, 
           COALESCE(p_reason, 'No reason provided'))
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'action', CASE WHEN p_block THEN 'blocked' ELSE 'unblocked' END,
    'reason', p_reason
  );
END;
$function$;

-- Create function to unapprove video
CREATE OR REPLACE FUNCTION public.admin_unapprove_video(p_pedido_video_id uuid, p_reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_admin_id uuid;
  v_result jsonb;
BEGIN
  -- Verify admin permissions
  v_admin_id := auth.uid();
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = v_admin_id 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Update video to rejected status
  UPDATE public.pedido_videos
  SET 
    approval_status = 'rejected',
    rejection_reason = p_reason,
    is_active = false,
    selected_for_display = false,
    is_base_video = false,
    updated_at = now()
  WHERE id = p_pedido_video_id;
  
  -- Log the action
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'VIDEO_UNAPPROVED',
    format('Admin %s unapproved video %s. Reason: %s', v_admin_id, p_pedido_video_id, p_reason)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'action', 'unapproved',
    'reason', p_reason
  );
END;
$function$;