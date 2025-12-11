-- Recriar função select_video_for_display com search_path correto
CREATE OR REPLACE FUNCTION public.select_video_for_display(p_pedido_video_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  FROM pedido_videos
  WHERE id = p_pedido_video_id;

  IF v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Pedido video not found';
  END IF;

  -- Check for schedule conflicts with other videos
  FOR v_other_video IN 
    SELECT id, video_id, is_base_video
    FROM pedido_videos
    WHERE pedido_id = v_pedido_id 
      AND id != p_pedido_video_id
      AND video_id IS NOT NULL
      AND selected_for_display = true
  LOOP
    -- Check for schedule conflict
    IF check_video_schedule_conflict(v_video_id, v_other_video.video_id) THEN
      RAISE EXCEPTION 'Schedule conflict detected with video %', v_other_video.video_id;
    END IF;
  END LOOP;

  -- Deselect all other videos in the same pedido
  UPDATE pedido_videos
  SET selected_for_display = false,
      updated_at = now()
  WHERE pedido_id = v_pedido_id 
    AND id != p_pedido_video_id
    AND selected_for_display = true;

  -- Select the target video
  UPDATE pedido_videos
  SET selected_for_display = true,
      updated_at = now()
  WHERE id = p_pedido_video_id;

  RETURN true;
END;
$$;

-- Também corrigir check_video_schedule_conflict com search_path
CREATE OR REPLACE FUNCTION public.check_video_schedule_conflict(p_video1_id UUID, p_video2_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conflict BOOLEAN := false;
  v_rule1 RECORD;
  v_rule2 RECORD;
  v_has_rules1 BOOLEAN := false;
  v_has_rules2 BOOLEAN := false;
  v_has_overlap BOOLEAN := false;
BEGIN
  BEGIN
    -- Verificar se o primeiro vídeo tem regras de agendamento
    SELECT EXISTS (
      SELECT 1
      FROM campaign_schedule_rules csr
      JOIN campaign_video_schedules cvs ON cvs.id = csr.campaign_video_schedule_id
      WHERE cvs.video_id = p_video1_id AND csr.is_active = true
    ) INTO v_has_rules1;
    
    -- Verificar se o segundo vídeo tem regras de agendamento
    SELECT EXISTS (
      SELECT 1
      FROM campaign_schedule_rules csr
      JOIN campaign_video_schedules cvs ON cvs.id = csr.campaign_video_schedule_id
      WHERE cvs.video_id = p_video2_id AND csr.is_active = true
    ) INTO v_has_rules2;
    
    -- Se qualquer um dos vídeos não tem regras de agendamento, não há conflito
    IF NOT v_has_rules1 OR NOT v_has_rules2 THEN
      RETURN false;
    END IF;
    
    -- Ambos os vídeos têm regras, verificar conflitos
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
        -- Verificar se há sobreposição de dias usando INTERSECT
        SELECT EXISTS (
          SELECT unnest(v_rule1.days_of_week)
          INTERSECT
          SELECT unnest(v_rule2.days_of_week)
        ) INTO v_has_overlap;
        
        IF v_has_overlap THEN
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
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Em caso de erro, retornar false (sem conflito)
      RETURN false;
  END;
  
  RETURN v_conflict;
END;
$$;