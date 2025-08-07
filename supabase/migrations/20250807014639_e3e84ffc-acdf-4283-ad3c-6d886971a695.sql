-- Atualizar função select_video_for_display para considerar conflitos reais de horário
CREATE OR REPLACE FUNCTION public.select_video_for_display(p_pedido_video_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_pedido_id uuid;
  v_video_id uuid;
  v_approval_status text;
  v_other_video RECORD;
BEGIN
  -- Verificar se o vídeo existe e obter dados necessários
  SELECT pedido_id, video_id, approval_status 
  INTO v_pedido_id, v_video_id, v_approval_status
  FROM public.pedido_videos 
  WHERE id = p_pedido_video_id;
  
  -- Verificar se o vídeo foi encontrado
  IF v_pedido_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- VALIDAÇÃO CRÍTICA: Apenas vídeos aprovados podem ser selecionados
  IF v_approval_status != 'approved' THEN
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
  
  -- Marcar o vídeo selecionado como ativo para exibição
  UPDATE public.pedido_videos 
  SET selected_for_display = true, updated_at = now()
  WHERE id = p_pedido_video_id;
  
  RETURN FOUND;
END;
$function$