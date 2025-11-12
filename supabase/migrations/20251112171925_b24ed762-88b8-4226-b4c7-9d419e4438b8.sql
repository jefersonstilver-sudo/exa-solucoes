
-- ============================================================================
-- RESTAURAR FUNÇÕES CRÍTICAS: approve_video e get_buildings_current_video_count
-- Drop das funções existentes antes de recriar
-- ============================================================================

-- Drop das funções existentes
DROP FUNCTION IF EXISTS public.get_current_display_video(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_buildings_current_video_count(uuid[]) CASCADE;
DROP FUNCTION IF EXISTS public.approve_video(uuid, uuid) CASCADE;

-- FUNÇÃO 1: approve_video - Aprovação de vídeos
CREATE FUNCTION public.approve_video(p_pedido_video_id uuid, p_approved_by uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id uuid;
  v_video_id uuid;
  v_is_first_approval boolean := false;
  v_plano_meses integer;
  v_existing_base boolean := false;
BEGIN
  -- Get the pedido_id and video_id for this video
  SELECT pedido_id, video_id INTO v_pedido_id, v_video_id
  FROM pedido_videos 
  WHERE id = p_pedido_video_id;
  
  IF v_pedido_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verificar se é a primeira aprovação deste pedido
  SELECT NOT EXISTS (
    SELECT 1 FROM pedido_videos 
    WHERE pedido_id = v_pedido_id 
    AND approval_status = 'approved'
    AND id != p_pedido_video_id
  ) INTO v_is_first_approval;
  
  -- Verificar se já existe um vídeo base
  SELECT EXISTS (
    SELECT 1 FROM pedido_videos 
    WHERE pedido_id = v_pedido_id 
    AND is_base_video = true
    AND approval_status = 'approved'
    AND id != p_pedido_video_id
  ) INTO v_existing_base;
  
  -- LÓGICA PRINCIPAL: Determinar se será vídeo base
  -- É base se: é primeiro aprovado OU não há vídeo base existente
  DECLARE
    v_will_be_base boolean := v_is_first_approval OR NOT v_existing_base;
  BEGIN
    -- Update the video approval status
    UPDATE pedido_videos 
    SET 
      approval_status = 'approved',
      approved_by = p_approved_by,
      approved_at = now(),
      is_active = true,
      is_base_video = v_will_be_base,
      selected_for_display = v_will_be_base,
      updated_at = now()
    WHERE id = p_pedido_video_id
    AND approval_status = 'pending';
    
    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;

    -- Se este vídeo foi definido como base, desmarcar outros
    IF v_will_be_base THEN
      UPDATE pedido_videos 
      SET 
        is_base_video = false, 
        selected_for_display = false,
        updated_at = now()
      WHERE pedido_id = v_pedido_id 
      AND id != p_pedido_video_id;
    END IF;
  END;

  -- Se é a primeira aprovação, atualizar as datas do contrato
  IF v_is_first_approval THEN
    -- Buscar plano do pedido
    SELECT plano_meses INTO v_plano_meses
    FROM pedidos 
    WHERE id = v_pedido_id;
    
    -- Atualizar datas do contrato
    UPDATE pedidos 
    SET 
      data_inicio = CURRENT_DATE,
      data_fim = CURRENT_DATE + (v_plano_meses || ' months')::interval
    WHERE id = v_pedido_id;
    
    -- Log da atualização de datas
    INSERT INTO log_eventos_sistema (
      tipo_evento,
      descricao
    ) VALUES (
      'CONTRACT_ACTIVATION',
      format('Contrato ativado para pedido %s: início=%s, fim=%s. Primeiro vídeo aprovado: %s', 
             v_pedido_id, CURRENT_DATE, CURRENT_DATE + (v_plano_meses || ' months')::interval, p_pedido_video_id)
    );
  END IF;
  
  -- Atualizar status do pedido
  UPDATE pedidos 
  SET status = 'video_aprovado'
  WHERE id = v_pedido_id
  AND status IN ('pago', 'pago_pendente_video', 'video_enviado');
  
  RETURN TRUE;
END;
$$;

-- FUNÇÃO 2: get_current_display_video - Retorna o vídeo em exibição AGORA
CREATE FUNCTION public.get_current_display_video(p_pedido_id uuid)
RETURNS TABLE(video_id uuid, is_scheduled boolean, priority_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    RETURN QUERY SELECT v_base_video, false, 'base'::text;
    RETURN;
  END IF;
  
  RETURN;
END;
$$;

-- FUNÇÃO 3: get_buildings_current_video_count - Conta vídeos em exibição por prédio
CREATE FUNCTION public.get_buildings_current_video_count(p_building_ids uuid[])
RETURNS TABLE(building_id uuid, current_videos_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.approve_video(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_display_video(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_buildings_current_video_count(uuid[]) TO authenticated, anon;

-- Comments
COMMENT ON FUNCTION public.approve_video IS 'Aprova um vídeo e define automaticamente como base se for o primeiro';
COMMENT ON FUNCTION public.get_current_display_video IS 'Retorna o vídeo que deve estar em exibição AGORA para um pedido, considerando agendamento e vídeos base';
COMMENT ON FUNCTION public.get_buildings_current_video_count IS 'Conta quantos vídeos estão em exibição AGORA para cada prédio, considerando agendamento';

-- Log
INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
VALUES ('MIGRATION', 'Restauradas funções críticas: approve_video, get_current_display_video, get_buildings_current_video_count com suporte completo a agendamentos');
