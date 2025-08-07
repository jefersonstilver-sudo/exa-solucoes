-- Corrigir a função approve_video para tratar vídeos de pedidos simples sem verificação de conflitos
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
  v_has_advanced_schedule boolean := false;
  v_other_has_advanced_schedule boolean := false;
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
  
  -- Verificar se o vídeo atual tem regras de agendamento (campanhas avançadas)
  SELECT EXISTS (
    SELECT 1
    FROM campaign_schedule_rules csr
    JOIN campaign_video_schedules cvs ON cvs.id = csr.campaign_video_schedule_id
    WHERE cvs.video_id = v_video_id AND csr.is_active = true
  ) INTO v_has_advanced_schedule;
  
  -- Processar outros vídeos selecionados no mesmo pedido
  FOR v_other_video IN
    SELECT pv.id, pv.video_id
    FROM public.pedido_videos pv
    WHERE pv.pedido_id = v_pedido_id
    AND pv.id != p_pedido_video_id
    AND pv.selected_for_display = true
    AND pv.approval_status = 'approved'
  LOOP
    -- Verificar se o outro vídeo tem regras de agendamento
    SELECT EXISTS (
      SELECT 1
      FROM campaign_schedule_rules csr
      JOIN campaign_video_schedules cvs ON cvs.id = csr.campaign_video_schedule_id
      WHERE cvs.video_id = v_other_video.video_id AND csr.is_active = true
    ) INTO v_other_has_advanced_schedule;
    
    -- Se ambos têm regras de agendamento, verificar conflitos reais
    IF v_has_advanced_schedule AND v_other_has_advanced_schedule THEN
      IF check_video_schedule_conflict(v_video_id, v_other_video.video_id) THEN
        UPDATE public.pedido_videos 
        SET selected_for_display = false, updated_at = now()
        WHERE id = v_other_video.id;
      END IF;
    ELSE
      -- Para vídeos de pedidos simples (sem regras de agendamento),
      -- usar lógica simples: apenas um vídeo selecionado por vez
      IF NOT v_has_advanced_schedule OR NOT v_other_has_advanced_schedule THEN
        UPDATE public.pedido_videos 
        SET selected_for_display = false, updated_at = now()
        WHERE id = v_other_video.id;
      END IF;
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
$function$;