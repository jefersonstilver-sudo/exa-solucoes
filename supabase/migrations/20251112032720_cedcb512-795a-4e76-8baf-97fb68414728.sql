-- ========================================
-- CORREÇÃO: Dados Inconsistentes e Ordem da RPC
-- ========================================

-- PARTE 1: Corrigir dados inconsistentes
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '🔧 Corrigindo vídeos base sem selected_for_display=true...';
  
  -- Corrigir todos os vídeos base que não estão marcados para exibição
  UPDATE pedido_videos
  SET 
    selected_for_display = true,
    is_active = true,
    updated_at = now()
  WHERE is_base_video = true
  AND selected_for_display = false;
  
  RAISE NOTICE '✅ Dados corrigidos';
END $$;

-- PARTE 2: Recriar RPC com ordem correta (marcar novo ANTES de desmarcar antigo)
-- ========================================

DROP FUNCTION IF EXISTS safe_set_base_video(UUID);

CREATE OR REPLACE FUNCTION safe_set_base_video(p_new_base_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_pedido_id UUID;
  v_old_base_id UUID;
  v_approval_status TEXT;
  v_video_id UUID;
BEGIN
  RAISE NOTICE '🔄 [RPC] safe_set_base_video iniciado para slot: %', p_new_base_id;
  
  -- 1. Buscar pedido_id, approval_status e video_id do novo vídeo base
  SELECT pedido_id, approval_status, video_id 
  INTO v_pedido_id, v_approval_status, v_video_id
  FROM pedido_videos
  WHERE id = p_new_base_id;
  
  IF v_pedido_id IS NULL THEN
    RAISE NOTICE '❌ [RPC] Vídeo não encontrado: %', p_new_base_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Vídeo não encontrado'
    );
  END IF;
  
  RAISE NOTICE '📋 [RPC] Pedido: %, Approval: %, Video: %', v_pedido_id, v_approval_status, v_video_id;
  
  -- 2. Validar que está aprovado
  IF v_approval_status != 'approved' THEN
    RAISE NOTICE '❌ [RPC] Vídeo não aprovado';
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas vídeos aprovados podem ser definidos como principal'
    );
  END IF;
  
  -- 3. Buscar vídeo base atual
  SELECT id INTO v_old_base_id
  FROM pedido_videos
  WHERE pedido_id = v_pedido_id
  AND is_base_video = true
  LIMIT 1;
  
  RAISE NOTICE '🔍 [RPC] Vídeo base atual: %', v_old_base_id;
  
  -- 4. Se já é o vídeo base, não fazer nada
  IF v_old_base_id = p_new_base_id THEN
    RAISE NOTICE 'ℹ️ [RPC] Vídeo já é o base atual';
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Vídeo já é o principal',
      'new_base_id', p_new_base_id,
      'pedido_id', v_pedido_id
    );
  END IF;
  
  -- 5. Remover agendamentos do novo vídeo base (se houver) ANTES de marcar
  IF v_video_id IS NOT NULL THEN
    DELETE FROM campaign_video_schedules
    WHERE video_id = v_video_id;
    
    RAISE NOTICE '🗑️ [RPC] Agendamentos removidos para video_id: %', v_video_id;
  END IF;
  
  -- 6. ORDEM CRÍTICA: Marcar NOVO vídeo base PRIMEIRO (evita conflito com trigger)
  UPDATE pedido_videos
  SET 
    is_base_video = true,
    is_active = true,
    selected_for_display = true,
    updated_at = now()
  WHERE id = p_new_base_id;
  
  RAISE NOTICE '✅ [RPC] Novo vídeo base definido: %', p_new_base_id;
  
  -- 7. DEPOIS desmarcar vídeo base anterior (agora há 2 bases, então trigger não bloqueia)
  IF v_old_base_id IS NOT NULL THEN
    UPDATE pedido_videos
    SET 
      is_base_video = false,
      updated_at = now()
    WHERE id = v_old_base_id;
    
    RAISE NOTICE '✅ [RPC] Vídeo base anterior desmarcado: %', v_old_base_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'old_base_id', v_old_base_id,
    'new_base_id', p_new_base_id,
    'pedido_id', v_pedido_id,
    'schedules_removed', v_video_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;