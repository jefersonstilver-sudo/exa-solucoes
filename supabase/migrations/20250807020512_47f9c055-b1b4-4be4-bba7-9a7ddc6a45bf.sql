-- Simplificar a função check_video_schedule_conflict removendo logs para evitar erros de transação read-only
CREATE OR REPLACE FUNCTION public.check_video_schedule_conflict(p_video1_id uuid, p_video2_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_conflict boolean := false;
  v_rule1 RECORD;
  v_rule2 RECORD;
  v_has_rules1 boolean := false;
  v_has_rules2 boolean := false;
  v_has_overlap boolean := false;
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
$function$;