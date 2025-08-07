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