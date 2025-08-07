-- Função auxiliar para verificar conflitos de horário entre vídeos
CREATE OR REPLACE FUNCTION public.check_video_schedule_conflict(
  p_video1_id uuid,
  p_video2_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_conflict boolean := false;
  v_rule1 RECORD;
  v_rule2 RECORD;
BEGIN
  -- Verificar se ambos os vídeos têm regras de agendamento
  FOR v_rule1 IN
    SELECT csr.days_of_week, csr.start_time, csr.end_time
    FROM campaign_schedule_rules csr
    JOIN campaign_video_schedules cvs ON cvs.id = csr.campaign_video_schedule_id
    WHERE cvs.video_id = p_video1_id AND csr.is_active = true
  LOOP
    FOR v_rule2 IN
      SELECT csr.days_of_week, csr.start_time, csr.end_time
      FROM campaign_schedule_rules csr
      JOIN campaign_video_schedules cvs ON cvs.id = csr.campaign_video_schedule_id
      WHERE cvs.video_id = p_video2_id AND csr.is_active = true
    LOOP
      -- Verificar se há sobreposição de dias
      IF v_rule1.days_of_week && v_rule2.days_of_week THEN
        -- Verificar se há sobreposição de horários
        IF (v_rule1.start_time < v_rule2.end_time AND v_rule1.end_time > v_rule2.start_time) THEN
          v_conflict := true;
          EXIT;
        END IF;
      END IF;
    END LOOP;
    
    IF v_conflict THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_conflict;
END;
$function$

---

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

---

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

---

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