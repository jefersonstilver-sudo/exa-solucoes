-- ===================================
-- CORREÇÃO: LÓGICA DE VÍDEO PRINCIPAL AUTOMÁTICO
-- ===================================

-- 1. CORRIGIR FUNÇÃO approve_video - Garantir primeiro vídeo = principal
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
  v_is_advanced_campaign boolean := false;
  v_is_first_approval boolean := false;
  v_plano_meses integer;
  v_has_active_videos boolean := false;
  v_existing_base boolean := false;
BEGIN
  -- Get the pedido_id and video_id for this video
  SELECT pedido_id, video_id INTO v_pedido_id, v_video_id
  FROM public.pedido_videos 
  WHERE id = p_pedido_video_id;
  
  IF v_pedido_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verificar se é a primeira aprovação deste pedido
  SELECT NOT EXISTS (
    SELECT 1 FROM public.pedido_videos 
    WHERE pedido_id = v_pedido_id 
    AND approval_status = 'approved'
    AND id != p_pedido_video_id
  ) INTO v_is_first_approval;
  
  -- Verificar se já existe um vídeo base
  SELECT EXISTS (
    SELECT 1 FROM public.pedido_videos 
    WHERE pedido_id = v_pedido_id 
    AND is_base_video = true
    AND approval_status = 'approved'
    AND id != p_pedido_video_id
  ) INTO v_existing_base;
  
  -- Verificar se já existem vídeos ativos no pedido
  SELECT EXISTS (
    SELECT 1 FROM public.pedido_videos 
    WHERE pedido_id = v_pedido_id 
    AND is_active = true
    AND approval_status = 'approved'
    AND id != p_pedido_video_id
  ) INTO v_has_active_videos;
  
  -- LÓGICA PRINCIPAL: Determinar se será vídeo base
  -- É base se: é primeiro aprovado OU não há vídeo base existente
  DECLARE
    v_will_be_base boolean := v_is_first_approval OR NOT v_existing_base;
  BEGIN
    -- Update the video approval status
    UPDATE public.pedido_videos 
    SET 
      approval_status = 'approved',
      approved_by = p_approved_by,
      approved_at = now(),
      is_active = true,  -- Ativar automaticamente quando aprovado
      -- CRÍTICO: Definir como base se for primeiro ou não houver base
      is_base_video = v_will_be_base,
      -- CRÍTICO: Selecionar para exibição se for vídeo base
      selected_for_display = v_will_be_base,
      updated_at = now()
    WHERE id = p_pedido_video_id
    AND approval_status = 'pending';
    
    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;

    -- Se este vídeo foi definido como base, desmarcar outros
    IF v_will_be_base THEN
      UPDATE public.pedido_videos 
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
    FROM public.pedidos 
    WHERE id = v_pedido_id;
    
    -- Atualizar datas do contrato: começa hoje
    UPDATE public.pedidos 
    SET 
      data_inicio = CURRENT_DATE,
      data_fim = CURRENT_DATE + (v_plano_meses || ' months')::interval
    WHERE id = v_pedido_id;
    
    -- Log da atualização de datas
    INSERT INTO public.log_eventos_sistema (
      tipo_evento,
      descricao
    ) VALUES (
      'CONTRACT_ACTIVATION',
      format('Contrato ativado para pedido %s: início=%s, fim=%s. Primeiro vídeo aprovado: %s', 
             v_pedido_id, CURRENT_DATE, CURRENT_DATE + (v_plano_meses || ' months')::interval, p_pedido_video_id)
    );
  END IF;
  
  -- Verificar se este pedido é parte de uma campanha avançada
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns_advanced ca 
    WHERE ca.pedido_id = v_pedido_id
  ) INTO v_is_advanced_campaign;
  
  -- Atualizar status do pedido para video_aprovado
  UPDATE public.pedidos 
  SET status = 'video_aprovado'
  WHERE id = v_pedido_id
  AND status IN ('pago', 'pago_pendente_video', 'video_enviado');
  
  RETURN TRUE;
END;
$function$;

-- 2. CORRIGIR TRIGGER pv_never_empty_when_approved - Priorizar vídeo base
CREATE OR REPLACE FUNCTION public.pv_never_empty_when_approved()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido uuid;
  has_selected boolean;
  has_approved boolean;
  has_base boolean;
  chosen uuid;
BEGIN
  v_pedido := COALESCE(NEW.pedido_id, OLD.pedido_id);

  -- Verificar se já há um vídeo selecionado
  SELECT EXISTS(
    SELECT 1 FROM public.pedido_videos 
    WHERE pedido_id = v_pedido 
    AND selected_for_display = true
  ) INTO has_selected;

  -- Verificar se há vídeos aprovados
  SELECT EXISTS(
    SELECT 1 FROM public.pedido_videos 
    WHERE pedido_id = v_pedido 
    AND approval_status = 'approved'
  ) INTO has_approved;

  -- Se há aprovados mas nenhum selecionado, selecionar um
  IF has_approved AND NOT has_selected THEN
    -- PRIORIDADE 1: Vídeo base (se existir)
    SELECT id INTO chosen 
    FROM public.pedido_videos
    WHERE pedido_id = v_pedido 
    AND approval_status = 'approved'
    AND is_base_video = true
    LIMIT 1;
    
    -- PRIORIDADE 2: Se não há base, pegar o mais recente aprovado
    IF chosen IS NULL THEN
      SELECT id INTO chosen FROM public.pedido_videos
      WHERE pedido_id = v_pedido 
      AND approval_status = 'approved'
      ORDER BY approved_at DESC NULLS LAST, updated_at DESC, created_at DESC
      LIMIT 1;
    END IF;

    -- Aplicar seleção se encontrou candidato
    IF chosen IS NOT NULL THEN
      UPDATE public.pedido_videos
      SET selected_for_display = true, is_active = true
      WHERE id = chosen;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$function$;

-- 3. CORRIGIR FUNÇÃO set_base_video_enhanced - Manter consistência
CREATE OR REPLACE FUNCTION public.set_base_video_enhanced(p_pedido_video_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_pedido_id uuid;
  v_video_id uuid;
  v_slot_position integer;
  v_approval_status text;
  v_old_base_video RECORD;
  v_result jsonb;
BEGIN
  -- Verificar se o vídeo existe e está aprovado
  SELECT pedido_id, video_id, slot_position, approval_status 
  INTO v_pedido_id, v_video_id, v_slot_position, v_approval_status
  FROM public.pedido_videos 
  WHERE id = p_pedido_video_id;
  
  IF v_pedido_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Vídeo não encontrado'
    );
  END IF;
  
  -- Só vídeos aprovados podem ser base
  IF v_approval_status != 'approved' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas vídeos aprovados podem ser definidos como base'
    );
  END IF;
  
  -- Obter informações do vídeo base atual
  SELECT pv.slot_position, pv.video_id 
  INTO v_old_base_video
  FROM public.pedido_videos pv
  WHERE pv.pedido_id = v_pedido_id 
  AND pv.is_base_video = true
  LIMIT 1;
  
  -- CRÍTICO: Desmarcar outros vídeos base E selecionados
  UPDATE public.pedido_videos 
  SET 
    is_base_video = false, 
    selected_for_display = false,
    updated_at = now()
  WHERE pedido_id = v_pedido_id 
  AND id != p_pedido_video_id;
  
  -- CRÍTICO: Marcar este vídeo como base E selecionado
  UPDATE public.pedido_videos 
  SET 
    is_base_video = true, 
    selected_for_display = true,
    is_active = true,
    updated_at = now()
  WHERE id = p_pedido_video_id;
  
  -- Desativar agendamentos do vídeo promovido a principal
  UPDATE public.campaign_schedule_rules 
  SET is_active = false, updated_at = now()
  WHERE campaign_video_schedule_id IN (
    SELECT cvs.id 
    FROM public.campaign_video_schedules cvs
    WHERE cvs.video_id = v_video_id
  );
  
  -- Registrar no log de gerenciamento
  INSERT INTO public.video_management_logs (
    pedido_id,
    action_type,
    slot_from,
    slot_to,
    video_from_id,
    video_to_id,
    details
  ) VALUES (
    v_pedido_id,
    'set_base_video',
    v_old_base_video.slot_position,
    v_slot_position,
    v_old_base_video.video_id,
    v_video_id,
    jsonb_build_object(
      'previous_base_slot', v_old_base_video.slot_position,
      'new_base_slot', v_slot_position,
      'schedules_deactivated', true,
      'pedido_video_id', p_pedido_video_id,
      'auto_selected', true
    )
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Vídeo definido como base e selecionado para exibição',
    'previous_base_slot', v_old_base_video.slot_position,
    'new_base_slot', v_slot_position,
    'schedules_deactivated', true,
    'auto_selected', true
  );
  
  RETURN v_result;
END;
$function$;

-- 4. CRIAR FUNÇÃO de verificação de consistência
CREATE OR REPLACE FUNCTION public.ensure_video_consistency(p_pedido_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_base_video uuid;
  v_selected_video uuid;
  v_result jsonb;
  v_corrections_made integer := 0;
BEGIN
  -- Buscar vídeo base atual
  SELECT id INTO v_base_video
  FROM public.pedido_videos
  WHERE pedido_id = p_pedido_id
  AND is_base_video = true
  AND approval_status = 'approved'
  LIMIT 1;
  
  -- Buscar vídeo selecionado atual
  SELECT id INTO v_selected_video
  FROM public.pedido_videos
  WHERE pedido_id = p_pedido_id
  AND selected_for_display = true
  AND approval_status = 'approved'
  LIMIT 1;
  
  -- CORREÇÃO 1: Se há base mas não é o selecionado
  IF v_base_video IS NOT NULL AND v_base_video != v_selected_video THEN
    UPDATE public.pedido_videos
    SET selected_for_display = false
    WHERE pedido_id = p_pedido_id
    AND id != v_base_video;
    
    UPDATE public.pedido_videos
    SET selected_for_display = true
    WHERE id = v_base_video;
    
    v_corrections_made := v_corrections_made + 1;
  END IF;
  
  -- CORREÇÃO 2: Se não há base mas há aprovados, definir o mais antigo como base
  IF v_base_video IS NULL THEN
    SELECT id INTO v_base_video
    FROM public.pedido_videos
    WHERE pedido_id = p_pedido_id
    AND approval_status = 'approved'
    ORDER BY approved_at ASC, created_at ASC
    LIMIT 1;
    
    IF v_base_video IS NOT NULL THEN
      UPDATE public.pedido_videos
      SET is_base_video = false, selected_for_display = false
      WHERE pedido_id = p_pedido_id;
      
      UPDATE public.pedido_videos
      SET is_base_video = true, selected_for_display = true, is_active = true
      WHERE id = v_base_video;
      
      v_corrections_made := v_corrections_made + 1;
    END IF;
  END IF;
  
  v_result := jsonb_build_object(
    'pedido_id', p_pedido_id,
    'base_video_id', v_base_video,
    'corrections_made', v_corrections_made,
    'consistent', v_corrections_made = 0,
    'timestamp', now()
  );
  
  RETURN v_result;
END;
$function$;