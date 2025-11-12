-- ========================================
-- MIGRATION: Correção e Proteção de Vídeos Base
-- ========================================

-- PARTE 1: Limpeza de Dados Órfãos
-- ========================================
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  RAISE NOTICE '🧹 [MIGRATION] Limpando registros órfãos...';
  
  -- Contar registros órfãos
  SELECT COUNT(*) INTO orphan_count
  FROM pedido_videos pv
  WHERE pv.video_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM videos v WHERE v.id = pv.video_id);
  
  RAISE NOTICE '📊 [MIGRATION] Encontrados % registros órfãos', orphan_count;
  
  -- Deletar registros órfãos (video_id que não existe em videos)
  DELETE FROM pedido_videos
  WHERE video_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM videos v WHERE v.id = video_id);
  
  RAISE NOTICE '✅ [MIGRATION] Registros órfãos removidos';
END $$;

-- PARTE 2: Correção de Dados - Pedidos sem vídeo base
-- ========================================
DO $$
DECLARE
  pedido_record RECORD;
  primeiro_aprovado UUID;
  current_base UUID;
BEGIN
  RAISE NOTICE '🔧 [MIGRATION] Iniciando correção de pedidos sem vídeo base...';
  
  -- Para cada pedido ativo sem vídeo base
  FOR pedido_record IN 
    SELECT DISTINCT p.id
    FROM pedidos p
    WHERE p.status IN ('ativo', 'video_aprovado', 'pago', 'pago_pendente_video')
  LOOP
    -- Verificar se já tem vídeo base
    SELECT id INTO current_base
    FROM pedido_videos
    WHERE pedido_id = pedido_record.id
    AND is_base_video = true
    LIMIT 1;
    
    -- Se não tem vídeo base, definir o primeiro aprovado
    IF current_base IS NULL THEN
      -- Pegar o primeiro vídeo aprovado (ou o mais antigo)
      SELECT id INTO primeiro_aprovado
      FROM pedido_videos
      WHERE pedido_id = pedido_record.id
      AND approval_status = 'approved'
      ORDER BY created_at ASC
      LIMIT 1;
      
      -- Se encontrou, marcar como base
      IF primeiro_aprovado IS NOT NULL THEN
        -- Desmarcar outros primeiro
        UPDATE pedido_videos
        SET 
          is_base_video = false,
          is_active = false,
          selected_for_display = false
        WHERE pedido_id = pedido_record.id
        AND id != primeiro_aprovado;
        
        -- Marcar o novo base
        UPDATE pedido_videos
        SET 
          is_base_video = true,
          is_active = true,
          selected_for_display = true,
          updated_at = now()
        WHERE id = primeiro_aprovado;
        
        RAISE NOTICE '✅ Pedido % corrigido: vídeo % definido como base', 
          pedido_record.id, primeiro_aprovado;
      ELSE
        RAISE NOTICE '⚠️ Pedido % não possui vídeos aprovados', pedido_record.id;
      END IF;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ [MIGRATION] Correção de dados concluída';
END $$;

-- PARTE 3: Trigger de Proteção contra Remoção do Último Vídeo Base
-- ========================================

-- Função que IMPEDE remover ou desmarcar o último vídeo base
CREATE OR REPLACE FUNCTION protect_last_base_video()
RETURNS TRIGGER AS $$
DECLARE
  base_count INTEGER;
  approved_count INTEGER;
BEGIN
  -- Se está tentando desmarcar is_base_video
  IF (TG_OP = 'UPDATE' AND OLD.is_base_video = true AND NEW.is_base_video = false) THEN
    -- Contar quantos outros vídeos base existem
    SELECT COUNT(*) INTO base_count
    FROM pedido_videos
    WHERE pedido_id = OLD.pedido_id
    AND is_base_video = true
    AND id != OLD.id;
    
    -- Se não há outros, NÃO PERMITIR
    IF base_count = 0 THEN
      RAISE EXCEPTION 'CANNOT_REMOVE_LAST_BASE_VIDEO: Não é possível desmarcar o único vídeo base. Defina outro vídeo como base primeiro.';
    END IF;
  END IF;
  
  -- Se está tentando deletar um vídeo base
  IF (TG_OP = 'DELETE' AND OLD.is_base_video = true) THEN
    -- Contar quantos vídeos aprovados existem além deste
    SELECT COUNT(*) INTO approved_count
    FROM pedido_videos
    WHERE pedido_id = OLD.pedido_id
    AND approval_status = 'approved'
    AND id != OLD.id;
    
    -- Se não há outros vídeos aprovados, NÃO PERMITIR
    IF approved_count = 0 THEN
      RAISE EXCEPTION 'CANNOT_DELETE_LAST_BASE_VIDEO: Não é possível remover o único vídeo aprovado. Envie outro vídeo primeiro.';
    END IF;
    
    -- Se há outros vídeos aprovados, promover o primeiro como base
    DECLARE
      next_base_id UUID;
    BEGIN
      SELECT id INTO next_base_id
      FROM pedido_videos
      WHERE pedido_id = OLD.pedido_id
      AND approval_status = 'approved'
      AND id != OLD.id
      ORDER BY created_at ASC
      LIMIT 1;
      
      IF next_base_id IS NOT NULL THEN
        UPDATE pedido_videos
        SET 
          is_base_video = true,
          is_active = true,
          selected_for_display = true,
          updated_at = now()
        WHERE id = next_base_id;
        
        RAISE NOTICE '🔄 Vídeo base transferido para: %', next_base_id;
      END IF;
    END;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger BEFORE (para bloquear antes de acontecer)
DROP TRIGGER IF EXISTS protect_last_base_video_trigger ON pedido_videos;
CREATE TRIGGER protect_last_base_video_trigger
  BEFORE UPDATE OR DELETE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION protect_last_base_video();

-- PARTE 4: RPC para Troca Segura de Vídeo Base
-- ========================================

-- RPC que garante troca atômica e segura do vídeo base
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
  
  -- 5. Desmarcar vídeo base anterior (se existir)
  IF v_old_base_id IS NOT NULL THEN
    UPDATE pedido_videos
    SET 
      is_base_video = false,
      updated_at = now()
    WHERE id = v_old_base_id;
    
    RAISE NOTICE '✅ [RPC] Vídeo base anterior desmarcado: %', v_old_base_id;
  END IF;
  
  -- 6. Remover agendamentos do novo vídeo base (se houver)
  IF v_video_id IS NOT NULL THEN
    DELETE FROM campaign_video_schedules
    WHERE video_id = v_video_id;
    
    RAISE NOTICE '🗑️ [RPC] Agendamentos removidos para video_id: %', v_video_id;
  END IF;
  
  -- 7. Marcar novo vídeo base
  UPDATE pedido_videos
  SET 
    is_base_video = true,
    is_active = true,
    selected_for_display = true,
    updated_at = now()
  WHERE id = p_new_base_id;
  
  RAISE NOTICE '✅ [RPC] Novo vídeo base definido: %', p_new_base_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'old_base_id', v_old_base_id,
    'new_base_id', p_new_base_id,
    'pedido_id', v_pedido_id,
    'schedules_removed', v_video_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;