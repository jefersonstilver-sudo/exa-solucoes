-- Atualizar função activate_video para considerar conflitos reais de horário
CREATE OR REPLACE FUNCTION public.activate_video(p_pedido_id uuid, p_pedido_video_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_video_id uuid;
  v_other_video RECORD;
BEGIN
  -- Verificar se o vídeo está aprovado e obter video_id
  SELECT video_id INTO v_video_id
  FROM public.pedido_videos 
  WHERE id = p_pedido_video_id 
  AND pedido_id = p_pedido_id 
  AND approval_status = 'approved';
  
  IF v_video_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar conflitos reais de horário antes de desativar outros vídeos
  FOR v_other_video IN
    SELECT pv.id, pv.video_id
    FROM public.pedido_videos pv
    WHERE pv.pedido_id = p_pedido_id
    AND pv.id != p_pedido_video_id
    AND pv.is_active = true
    AND pv.approval_status = 'approved'
  LOOP
    -- Se há conflito real de horário, desativar o vídeo conflitante
    IF check_video_schedule_conflict(v_video_id, v_other_video.video_id) THEN
      UPDATE public.pedido_videos 
      SET is_active = false, updated_at = now()
      WHERE id = v_other_video.id;
    END IF;
  END LOOP;
  
  -- Ativar o vídeo selecionado
  UPDATE public.pedido_videos 
  SET is_active = true, updated_at = now()
  WHERE id = p_pedido_video_id;
  
  RETURN TRUE;
END;
$function$