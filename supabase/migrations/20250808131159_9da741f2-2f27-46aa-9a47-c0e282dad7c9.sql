-- Corrigir a função get_current_display_video para priorizar vídeos agendados
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
  v_brasilia_time timestamp with time zone;
BEGIN
  -- Obter horário atual de Brasília (UTC-3)
  v_brasilia_time := NOW() AT TIME ZONE 'America/Sao_Paulo';
  v_current_day := EXTRACT(DOW FROM v_brasilia_time); -- 0 = Sunday, 1 = Monday, etc.
  v_current_time := v_brasilia_time::time;
  
  -- Log para debug com horário de Brasília
  RAISE NOTICE 'Verificando vídeo atual para pedido %. Brasília: %, Dia: %, Hora: %', 
    p_pedido_id, v_brasilia_time, v_current_day, v_current_time;
  
  -- PRIORIDADE 1: Verificar se há vídeo agendado no momento atual em Brasília
  -- REMOVENDO a verificação pv.is_active = true para vídeos agendados
  SELECT pv.video_id INTO v_scheduled_video
  FROM public.pedido_videos pv
  JOIN public.campaign_video_schedules cvs ON cvs.video_id = pv.video_id
  JOIN public.campaign_schedule_rules csr ON csr.campaign_video_schedule_id = cvs.id
  JOIN public.campaigns_advanced ca ON ca.id = cvs.campaign_id
  WHERE pv.pedido_id = p_pedido_id
  AND pv.approval_status = 'approved'
  -- REMOVIDO: AND pv.is_active = true -- Vídeos agendados não precisam estar "ativos"
  AND csr.is_active = true
  AND ca.status = 'active'
  -- CRÍTICO: Verificar se hoje está nos dias programados E se está no horário (Brasília)
  AND v_current_day = ANY(csr.days_of_week)
  AND v_current_time BETWEEN csr.start_time AND csr.end_time
  ORDER BY cvs.priority DESC, csr.start_time ASC
  LIMIT 1;
  
  -- Se há vídeo agendado ATIVO AGORA em Brasília, retornar ele
  IF v_scheduled_video IS NOT NULL THEN
    RAISE NOTICE 'Vídeo agendado ativo encontrado: % (Brasília: %)', v_scheduled_video, v_brasilia_time;
    RETURN QUERY SELECT v_scheduled_video, true, 'scheduled'::text;
    RETURN;
  END IF;
  
  -- PRIORIDADE 2: Caso contrário, retornar vídeo base
  SELECT pv.video_id INTO v_base_video
  FROM public.pedido_videos pv
  WHERE pv.pedido_id = p_pedido_id
  AND pv.approval_status = 'approved'
  AND pv.is_base_video = true
  LIMIT 1;
  
  IF v_base_video IS NOT NULL THEN
    RAISE NOTICE 'Usando vídeo base: % (Brasília: %)', v_base_video, v_brasilia_time;
    RETURN QUERY SELECT v_base_video, false, 'base'::text;
  ELSE
    RAISE NOTICE 'Nenhum vídeo encontrado para exibição (Brasília: %)', v_brasilia_time;
  END IF;
  
  RETURN;
END;
$function$;