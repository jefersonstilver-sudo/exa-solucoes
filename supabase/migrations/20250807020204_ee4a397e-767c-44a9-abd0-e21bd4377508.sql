-- Corrigir a função check_video_schedule_conflict para usar comparação de arrays mais robusta
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
  -- Log para debug
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'VIDEO_CONFLICT_CHECK_START',
    format('Verificando conflito entre vídeos: %s e %s', p_video1_id, p_video2_id)
  );

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
      INSERT INTO public.log_eventos_sistema (
        tipo_evento,
        descricao
      ) VALUES (
        'VIDEO_CONFLICT_CHECK_NO_RULES',
        format('Sem regras para um dos vídeos: v1_rules=%s, v2_rules=%s', v_has_rules1, v_has_rules2)
      );
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
        -- Verificar se há sobreposição de dias usando uma abordagem mais robusta
        -- Usar INTERSECT ao invés do operador &&
        SELECT EXISTS (
          SELECT unnest(v_rule1.days_of_week)
          INTERSECT
          SELECT unnest(v_rule2.days_of_week)
        ) INTO v_has_overlap;
        
        IF v_has_overlap THEN
          -- Verificar se há sobreposição de horários
          IF (v_rule1.start_time < v_rule2.end_time AND v_rule1.end_time > v_rule2.start_time) THEN
            v_conflict := true;
            
            INSERT INTO public.log_eventos_sistema (
              tipo_evento,
              descricao
            ) VALUES (
              'VIDEO_CONFLICT_DETECTED',
              format('Conflito detectado: v1[%s-%s], v2[%s-%s]', 
                     v_rule1.start_time, v_rule1.end_time, 
                     v_rule2.start_time, v_rule2.end_time)
            );
            
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
      -- Em caso de erro, registrar e retornar false (sem conflito)
      INSERT INTO public.log_eventos_sistema (
        tipo_evento,
        descricao
      ) VALUES (
        'VIDEO_CONFLICT_CHECK_ERROR',
        format('Erro ao verificar conflito: %s', SQLERRM)
      );
      
      RETURN false;
  END;
  
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'VIDEO_CONFLICT_CHECK_RESULT',
    format('Resultado da verificação: %s', v_conflict)
  );
  
  RETURN v_conflict;
END;
$function$;