-- Corrigir a função get_current_display_video para aplicar lógica temporal corretamente
DROP FUNCTION IF EXISTS public.get_current_display_video(uuid);

CREATE OR REPLACE FUNCTION public.get_current_display_video(p_pedido_id uuid)
 RETURNS TABLE(video_id uuid, is_scheduled boolean, priority_type text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_current_day integer;
  v_current_time time;
  v_scheduled_video uuid;
  v_base_video uuid;
BEGIN
  -- Obter dia e hora atuais 
  v_current_day := EXTRACT(DOW FROM NOW()); -- 0 = Sunday, 1 = Monday, etc.
  v_current_time := NOW()::time;
  
  -- Log para debug
  RAISE NOTICE 'Verificando vídeo atual para pedido %. Dia: %, Hora: %', p_pedido_id, v_current_day, v_current_time;
  
  -- Verificar se há vídeo agendado ATIVO no momento atual
  SELECT pv.video_id INTO v_scheduled_video
  FROM public.pedido_videos pv
  JOIN public.campaign_video_schedules cvs ON cvs.video_id = pv.video_id
  JOIN public.campaign_schedule_rules csr ON csr.campaign_video_schedule_id = cvs.id
  WHERE pv.pedido_id = p_pedido_id
  AND pv.approval_status = 'approved'
  AND pv.is_active = true
  AND csr.is_active = true
  -- CRÍTICO: Verificar se hoje está nos dias programados E se está no horário
  AND v_current_day = ANY(csr.days_of_week)
  AND v_current_time BETWEEN csr.start_time AND csr.end_time
  ORDER BY cvs.priority DESC
  LIMIT 1;
  
  -- Se há vídeo agendado ATIVO AGORA, retornar ele
  IF v_scheduled_video IS NOT NULL THEN
    RAISE NOTICE 'Vídeo agendado ativo encontrado: %', v_scheduled_video;
    RETURN QUERY SELECT v_scheduled_video, true, 'scheduled'::text;
    RETURN;
  END IF;
  
  -- Caso contrário, retornar vídeo base
  SELECT pv.video_id INTO v_base_video
  FROM public.pedido_videos pv
  WHERE pv.pedido_id = p_pedido_id
  AND pv.approval_status = 'approved'
  AND pv.is_base_video = true
  LIMIT 1;
  
  IF v_base_video IS NOT NULL THEN
    RAISE NOTICE 'Usando vídeo base: %', v_base_video;
    RETURN QUERY SELECT v_base_video, false, 'base'::text;
  ELSE
    RAISE NOTICE 'Nenhum vídeo encontrado para exibição';
  END IF;
  
  RETURN;
END;
$function$;