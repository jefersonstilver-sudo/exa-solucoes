-- ============================================================
-- PARTE 1: CORREÇÃO COMPLETA DO SISTEMA DE VÍDEO BASE
-- ============================================================

-- 1.1: Atualizar função set_base_video_enhanced
CREATE OR REPLACE FUNCTION public.set_base_video_enhanced(p_pedido_video_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id uuid;
  v_video_id uuid;
  v_old_base_id uuid;
  v_result jsonb;
BEGIN
  -- Definir contexto RPC para bypass de triggers
  PERFORM set_config('app.in_rpc_context', 'true', true);

  -- Buscar pedido_id e video_id
  SELECT pedido_id, video_id INTO v_pedido_id, v_video_id
  FROM pedido_videos
  WHERE id = p_pedido_video_id;

  IF v_pedido_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Vídeo não encontrado'
    );
  END IF;

  -- Buscar vídeo base anterior
  SELECT id INTO v_old_base_id
  FROM pedido_videos
  WHERE pedido_id = v_pedido_id
    AND is_base_video = true
    AND id != p_pedido_video_id;

  -- Remover flag de base do vídeo anterior
  IF v_old_base_id IS NOT NULL THEN
    UPDATE pedido_videos
    SET 
      is_base_video = false,
      selected_for_display = false,
      updated_at = NOW()
    WHERE id = v_old_base_id;
  END IF;

  -- Definir novo vídeo base (SEMPRE com is_active = true)
  UPDATE pedido_videos
  SET 
    is_base_video = true,
    is_active = true,  -- CRÍTICO: vídeo base sempre ativo
    selected_for_display = true,
    approval_status = 'approved',
    updated_at = NOW()
  WHERE id = p_pedido_video_id;

  -- Desativar todas as regras de agendamento do vídeo base
  -- (vídeo base não pode ter agendamento simultâneo)
  UPDATE campaign_schedule_rules csr
  SET is_active = false
  FROM campaign_video_schedules cvs
  WHERE csr.campaign_video_schedule_id = cvs.id
    AND cvs.video_id = v_video_id;

  -- Resetar contexto
  PERFORM set_config('app.in_rpc_context', 'false', true);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Vídeo base definido com sucesso',
    'old_base_id', v_old_base_id,
    'new_base_id', p_pedido_video_id
  );

EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('app.in_rpc_context', 'false', true);
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;

-- 1.2: Criar/Reforçar trigger de proteção do vídeo base
CREATE OR REPLACE FUNCTION public.protect_base_video_always_active()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Permitir bypass se estiver em contexto RPC
  IF current_setting('app.in_rpc_context', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Se é vídeo base, garantir que is_active seja sempre true
  IF NEW.is_base_video = true AND NEW.is_active = false THEN
    RAISE EXCEPTION 'Vídeo base deve permanecer sempre ativo (is_active=true). Use a RPC set_base_video_enhanced para alterações.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_base_video_always_active ON pedido_videos;
CREATE TRIGGER trigger_protect_base_video_always_active
  BEFORE UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION protect_base_video_always_active();

-- 1.3: Atualizar função activate_scheduled_video
CREATE OR REPLACE FUNCTION public.activate_scheduled_video(
  p_video_id uuid,
  p_pedido_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_video_id uuid;
  v_result jsonb;
BEGIN
  -- Definir contexto RPC para bypass de triggers
  PERFORM set_config('app.in_rpc_context', 'true', true);

  -- Buscar vídeo base do pedido
  SELECT id INTO v_base_video_id
  FROM pedido_videos
  WHERE pedido_id = p_pedido_id
    AND is_base_video = true
  LIMIT 1;

  -- 1. Desativar APENAS vídeos NÃO-BASE (is_base_video = false)
  UPDATE pedido_videos
  SET 
    is_active = false,
    selected_for_display = false,
    updated_at = NOW()
  WHERE pedido_id = p_pedido_id
    AND is_base_video = false;

  -- 2. Para vídeo base: manter is_active=true, apenas remover selected_for_display
  IF v_base_video_id IS NOT NULL THEN
    UPDATE pedido_videos
    SET 
      selected_for_display = false,
      updated_at = NOW()
    WHERE id = v_base_video_id;
  END IF;

  -- 3. Ativar o vídeo agendado
  UPDATE pedido_videos
  SET 
    is_active = true,
    selected_for_display = true,
    updated_at = NOW()
  WHERE video_id = p_video_id
    AND pedido_id = p_pedido_id;

  -- Resetar contexto
  PERFORM set_config('app.in_rpc_context', 'false', true);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Vídeo agendado ativado com sucesso',
    'activated_video_id', p_video_id,
    'base_video_id', v_base_video_id
  );

EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('app.in_rpc_context', 'false', true);
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;

-- 1.4: Criar trigger de reativação automática do vídeo base
CREATE OR REPLACE FUNCTION public.reactivate_base_video_when_no_schedules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_pedido_id uuid;
  v_base_video_id uuid;
  v_active_schedules_count int;
BEGIN
  -- Buscar pedido_id do vídeo
  SELECT cvs.pedido_id INTO v_pedido_id
  FROM campaign_video_schedules cvs
  WHERE cvs.id = OLD.campaign_video_schedule_id;

  IF v_pedido_id IS NULL THEN
    RETURN OLD;
  END IF;

  -- Contar agendamentos ativos no pedido
  SELECT COUNT(*) INTO v_active_schedules_count
  FROM campaign_schedule_rules csr
  JOIN campaign_video_schedules cvs ON cvs.id = csr.campaign_video_schedule_id
  WHERE cvs.pedido_id = v_pedido_id
    AND csr.is_active = true;

  -- Se não há mais agendamentos ativos, reativar vídeo base
  IF v_active_schedules_count = 0 THEN
    SELECT id INTO v_base_video_id
    FROM pedido_videos
    WHERE pedido_id = v_pedido_id
      AND is_base_video = true
    LIMIT 1;

    IF v_base_video_id IS NOT NULL THEN
      -- Definir contexto RPC para bypass de triggers
      PERFORM set_config('app.in_rpc_context', 'true', true);
      
      UPDATE pedido_videos
      SET 
        is_active = true,
        selected_for_display = true,
        updated_at = NOW()
      WHERE id = v_base_video_id;
      
      PERFORM set_config('app.in_rpc_context', 'false', true);
    END IF;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_reactivate_base_video ON campaign_schedule_rules;
CREATE TRIGGER trigger_reactivate_base_video
  AFTER UPDATE OF is_active OR DELETE ON campaign_schedule_rules
  FOR EACH ROW
  EXECUTE FUNCTION reactivate_base_video_when_no_schedules();

-- 1.5: Migração para corrigir dados existentes
DO $$
DECLARE
  v_pedido record;
  v_base_video_id uuid;
  v_first_approved_video_id uuid;
BEGIN
  -- Para cada pedido ativo sem vídeo base definido
  FOR v_pedido IN 
    SELECT DISTINCT p.id as pedido_id
    FROM pedidos p
    WHERE p.status IN ('video_aprovado', 'ativo', 'em_exibicao')
      AND NOT EXISTS (
        SELECT 1 FROM pedido_videos pv
        WHERE pv.pedido_id = p.id
          AND pv.is_base_video = true
      )
  LOOP
    -- Buscar primeiro vídeo aprovado (prioridade: slot 1)
    SELECT id INTO v_first_approved_video_id
    FROM pedido_videos
    WHERE pedido_id = v_pedido.pedido_id
      AND approval_status = 'approved'
    ORDER BY slot_position ASC, created_at ASC
    LIMIT 1;

    -- Se encontrou, definir como vídeo base
    IF v_first_approved_video_id IS NOT NULL THEN
      -- Definir contexto RPC para bypass de triggers
      PERFORM set_config('app.in_rpc_context', 'true', true);
      
      UPDATE pedido_videos
      SET 
        is_base_video = true,
        is_active = true,
        selected_for_display = true,
        updated_at = NOW()
      WHERE id = v_first_approved_video_id;
      
      PERFORM set_config('app.in_rpc_context', 'false', true);
      
      RAISE NOTICE 'Vídeo base definido para pedido %: %', v_pedido.pedido_id, v_first_approved_video_id;
    END IF;
  END LOOP;
END;
$$;