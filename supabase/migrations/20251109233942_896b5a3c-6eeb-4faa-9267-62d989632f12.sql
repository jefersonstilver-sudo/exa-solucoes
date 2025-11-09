-- CORREÇÃO 1: Corrigir RPC get_buildings_current_video_count (ambiguidade de coluna)
CREATE OR REPLACE FUNCTION public.get_buildings_current_video_count(p_building_ids uuid[])
RETURNS TABLE(building_id uuid, current_videos_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  RETURN QUERY
  WITH target_buildings AS (
    SELECT unnest(p_building_ids) AS bid
  ),
  pedidos_for_building AS (
    SELECT tb.bid AS building_id, p.id AS pedido_id
    FROM target_buildings tb
    JOIN pedidos p 
      ON (p.lista_predios @> ARRAY[tb.bid::text])
    WHERE p.status IN ('ativo','video_aprovado','pago_pendente_video','video_enviado','pago')
      AND (p.data_inicio IS NULL OR p.data_inicio <= v_today)
      AND (p.data_fim IS NULL OR p.data_fim >= v_today)
  ),
  current_videos AS (
    SELECT pfb.building_id, gv.video_id
    FROM pedidos_for_building pfb
    LEFT JOIN LATERAL get_current_display_video(pfb.pedido_id) AS gv ON TRUE
  )
  SELECT cv.building_id, COUNT(DISTINCT cv.video_id)::int AS current_videos_count
  FROM current_videos cv
  WHERE cv.video_id IS NOT NULL
  GROUP BY cv.building_id;
END;
$$;

-- CORREÇÃO 2: Corrigir RPC get_current_display_video (coluna is_base_video não existe)
-- Usar selected_for_display ao invés de is_base_video
CREATE OR REPLACE FUNCTION public.get_current_display_video(p_pedido_id uuid)
RETURNS TABLE(video_id uuid, is_scheduled boolean, priority_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_day integer;
  v_current_time time;
  v_scheduled_video uuid;
  v_base_video uuid;
  v_brasilia_time timestamp with time zone;
BEGIN
  -- Obter horário atual de Brasília (UTC-3)
  v_brasilia_time := NOW() AT TIME ZONE 'America/Sao_Paulo';
  v_current_day := EXTRACT(DOW FROM v_brasilia_time);
  v_current_time := v_brasilia_time::time;
  
  RAISE NOTICE 'Verificando vídeo para pedido %. Brasília: %, Dia: %, Hora: %', 
    p_pedido_id, v_brasilia_time, v_current_day, v_current_time;
  
  -- PRIORIDADE 1: Vídeo agendado ativo AGORA
  SELECT pv.video_id INTO v_scheduled_video
  FROM pedido_videos pv
  JOIN campaign_video_schedules cvs ON cvs.video_id = pv.video_id
  JOIN campaign_schedule_rules csr ON csr.campaign_video_schedule_id = cvs.id
  JOIN campaigns_advanced ca ON ca.id = cvs.campaign_id
  WHERE pv.pedido_id = p_pedido_id
  AND pv.approval_status = 'approved'
  AND csr.is_active = true
  AND ca.status = 'active'
  AND v_current_day = ANY(csr.days_of_week)
  AND v_current_time BETWEEN csr.start_time AND csr.end_time
  ORDER BY cvs.priority DESC, csr.start_time ASC
  LIMIT 1;
  
  IF v_scheduled_video IS NOT NULL THEN
    RAISE NOTICE 'Vídeo agendado ativo: %', v_scheduled_video;
    RETURN QUERY SELECT v_scheduled_video, true, 'scheduled'::text;
    RETURN;
  END IF;
  
  -- PRIORIDADE 2: Vídeo base (selected_for_display = true)
  SELECT pv.video_id INTO v_base_video
  FROM pedido_videos pv
  WHERE pv.pedido_id = p_pedido_id
  AND pv.approval_status = 'approved'
  AND pv.is_active = true
  AND pv.selected_for_display = true
  ORDER BY pv.slot_position ASC
  LIMIT 1;
  
  IF v_base_video IS NOT NULL THEN
    RAISE NOTICE 'Usando vídeo base: %', v_base_video;
    RETURN QUERY SELECT v_base_video, false, 'base'::text;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Nenhum vídeo encontrado';
  RETURN;
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION get_current_display_video IS 'Retorna o vídeo que deve estar em exibição AGORA para um pedido, considerando agendamento e vídeos base';
COMMENT ON FUNCTION get_buildings_current_video_count IS 'Conta quantos vídeos estão em exibição AGORA para cada prédio, considerando agendamento';
