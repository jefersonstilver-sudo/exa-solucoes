-- Atualizar função approve_video para considerar conflitos reais de horário
CREATE OR REPLACE FUNCTION public.approve_video(p_pedido_video_id uuid, p_approved_by uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_pedido_id uuid;
  v_video_id uuid;
  v_other_video RECORD;
BEGIN
  -- Get the pedido_id and video_id for this video
  SELECT pedido_id, video_id INTO v_pedido_id, v_video_id
  FROM public.pedido_videos 
  WHERE id = p_pedido_video_id;
  
  IF v_pedido_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update the video approval status
  UPDATE public.pedido_videos 
  SET 
    approval_status = 'approved',
    approved_by = p_approved_by,
    approved_at = now(),
    updated_at = now()
  WHERE id = p_pedido_video_id
  AND approval_status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar conflitos reais de horário antes de desmarcar outros vídeos
  FOR v_other_video IN
    SELECT pv.id, pv.video_id
    FROM public.pedido_videos pv
    WHERE pv.pedido_id = v_pedido_id
    AND pv.id != p_pedido_video_id
    AND pv.selected_for_display = true
    AND pv.approval_status = 'approved'
  LOOP
    -- Se há conflito real de horário, desmarcar o vídeo conflitante
    IF check_video_schedule_conflict(v_video_id, v_other_video.video_id) THEN
      UPDATE public.pedido_videos 
      SET selected_for_display = false, updated_at = now()
      WHERE id = v_other_video.id;
    END IF;
  END LOOP;
  
  -- Marcar o vídeo aprovado como selecionado para exibição
  UPDATE public.pedido_videos 
  SET selected_for_display = true, updated_at = now()
  WHERE id = p_pedido_video_id;
  
  -- Atualizar status do pedido para video_aprovado
  UPDATE public.pedidos 
  SET status = 'video_aprovado'
  WHERE id = v_pedido_id
  AND status IN ('pago', 'pago_pendente_video', 'video_enviado');
  
  RETURN TRUE;
END;
$function$