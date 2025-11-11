-- Correção CRÍTICA: Resolver conflito de triggers que causa erro
-- "tuple to be updated was already modified by an operation triggered by the current command"

-- Problema: Múltiplos triggers (validate_base_video_rules_trigger e pv_auto_select_on_approval_trg) 
-- estão modificando a mesma linha simultaneamente quando set_base_video_enhanced é chamada

-- Solução: Usar uma configuração de sessão para identificar quando a RPC está rodando
-- e fazer os triggers pularem a execução nesse caso

-- 1. Modificar validate_base_video_rules para verificar se está em contexto de RPC
CREATE OR REPLACE FUNCTION public.validate_base_video_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  v_remaining_approved_videos integer;
  v_contract_started boolean;
  v_is_base_video boolean;
  v_is_super_admin boolean;
BEGIN
  -- IMPORTANTE: Se estamos em contexto de RPC set_base_video_enhanced, pular validações
  -- A RPC já garante a integridade dos dados
  IF current_setting('app.in_rpc_context', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Regra 1: Ao marcar como base, garantir que selected_for_display e is_active sejam true
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.is_base_video = true THEN
    NEW.selected_for_display := true;
    NEW.is_active := true;
  END IF;
  
  -- Regra 2: BLOQUEAR remoção de is_base_video se for o único vídeo aprovado
  IF TG_OP = 'UPDATE' AND OLD.is_base_video = true AND NEW.is_base_video = false THEN
    SELECT COUNT(*) INTO v_remaining_approved_videos
    FROM pedido_videos
    WHERE pedido_id = OLD.pedido_id
    AND approval_status = 'approved'
    AND id != OLD.id;
    
    IF v_remaining_approved_videos = 0 THEN
      RAISE EXCEPTION 'Não é possível remover o último vídeo principal. Defina outro vídeo como principal primeiro.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Modificar pv_auto_select_on_approval para pular quando em contexto de RPC
CREATE OR REPLACE FUNCTION public.pv_auto_select_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  has_selected boolean;
BEGIN
  -- IMPORTANTE: Se estamos em contexto de RPC set_base_video_enhanced, pular
  -- A RPC já define os valores corretos
  IF current_setting('app.in_rpc_context', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.approval_status = 'approved' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.pedido_videos
      WHERE pedido_id = NEW.pedido_id AND selected_for_display = true
    ) INTO has_selected;

    IF NOT has_selected THEN
      NEW.selected_for_display := true;
      NEW.is_active := COALESCE(NEW.is_active, true);
      IF NEW.approved_at IS NULL THEN
        NEW.approved_at := now();
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Atualizar set_base_video_enhanced para definir contexto de RPC
CREATE OR REPLACE FUNCTION public.set_base_video_enhanced(p_pedido_video_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido_id uuid;
  v_status text;
  v_video_id uuid;
  v_affected_rows int;
  v_old_base_video_id uuid;
BEGIN
  -- CRÍTICO: Sinalizar que estamos em contexto de RPC para evitar conflitos de triggers
  PERFORM set_config('app.in_rpc_context', 'true', true);
  
  -- Log de início
  RAISE NOTICE 'set_base_video_enhanced: Iniciando para slot %', p_pedido_video_id;
  
  -- Validar slot e status aprovado + lock da linha alvo
  SELECT pedido_id, approval_status, video_id
  INTO v_pedido_id, v_status, v_video_id
  FROM public.pedido_videos
  WHERE id = p_pedido_video_id
  FOR UPDATE;

  IF v_pedido_id IS NULL THEN
    RAISE WARNING 'set_base_video_enhanced: Slot % não encontrado', p_pedido_video_id;
    RETURN jsonb_build_object('success', false, 'error', 'slot_not_found');
  END IF;
  
  IF v_status <> 'approved' THEN
    RAISE WARNING 'set_base_video_enhanced: Slot % não aprovado (status: %)', p_pedido_video_id, v_status;
    RETURN jsonb_build_object('success', false, 'error', 'not_approved', 'status', v_status);
  END IF;

  RAISE NOTICE 'set_base_video_enhanced: Slot válido. Pedido: %, Vídeo: %', v_pedido_id, v_video_id;

  -- Capturar o ID do vídeo do vídeo base atual (se houver)
  SELECT video_id INTO v_old_base_video_id
  FROM public.pedido_videos
  WHERE pedido_id = v_pedido_id 
    AND is_base_video = true 
    AND id <> p_pedido_video_id
  LIMIT 1;

  -- Lock de todas as linhas do mesmo pedido
  PERFORM 1 FROM public.pedido_videos WHERE pedido_id = v_pedido_id FOR UPDATE;

  -- Desmarcar/Desativar outros vídeos desse pedido
  UPDATE public.pedido_videos
  SET selected_for_display = false,
      is_base_video = false,
      is_active = false,
      updated_at = now()
  WHERE pedido_id = v_pedido_id
    AND id <> p_pedido_video_id;
    
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RAISE NOTICE 'set_base_video_enhanced: % vídeos desmarcados', v_affected_rows;

  -- Marcar o novo vídeo como base
  UPDATE public.pedido_videos
  SET selected_for_display = true,
      is_base_video = true,
      is_active = true,
      updated_at = now()
  WHERE id = p_pedido_video_id;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  
  IF v_affected_rows = 0 THEN
    RAISE WARNING 'set_base_video_enhanced: Falha ao marcar slot % como base', p_pedido_video_id;
    RETURN jsonb_build_object('success', false, 'error', 'update_failed');
  END IF;
  
  RAISE NOTICE 'set_base_video_enhanced: Slot % marcado como base com sucesso', p_pedido_video_id;

  -- Desativar regras de agendamento do novo vídeo principal
  UPDATE public.campaign_schedule_rules
  SET is_active = false, updated_at = now()
  WHERE campaign_video_schedule_id IN (
    SELECT id FROM public.campaign_video_schedules
    WHERE video_id = v_video_id
  ) AND is_active = true;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RAISE NOTICE 'set_base_video_enhanced: % regras desativadas para o novo principal', v_affected_rows;

  -- Reativar agendamentos do vídeo anterior
  IF v_old_base_video_id IS NOT NULL THEN
    UPDATE public.campaign_schedule_rules
    SET is_active = true, updated_at = now()
    WHERE campaign_video_schedule_id IN (
      SELECT id FROM public.campaign_video_schedules
      WHERE video_id = v_old_base_video_id
    );
    
    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    RAISE NOTICE 'set_base_video_enhanced: % regras reativadas para o anterior', v_affected_rows;
  END IF;

  -- Limpar contexto de RPC
  PERFORM set_config('app.in_rpc_context', 'false', true);

  RETURN jsonb_build_object(
    'success', true, 
    'pedido_id', v_pedido_id, 
    'video_id', v_video_id,
    'old_base_video_id', v_old_base_video_id,
    'message', 'Vídeo base definido com sucesso'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Garantir limpeza do contexto mesmo em caso de erro
    PERFORM set_config('app.in_rpc_context', 'false', true);
    RAISE WARNING 'set_base_video_enhanced: Erro: % - %', SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'exception', 
      'message', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$function$;