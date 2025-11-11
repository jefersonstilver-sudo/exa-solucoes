-- ========================================
-- MIGRATION: Fix Principal Video System
-- ========================================
-- Objetivo: Garantir que SEMPRE haja EXATAMENTE UM vídeo principal por pedido

-- ETAPA 1: Corrigir estado atual do banco de dados
-- ========================================

-- 1.1 Garantir que Slot 1 do pedido específico seja o vídeo principal
UPDATE pedido_videos
SET is_base_video = true,
    updated_at = now()
WHERE pedido_id = 'c0214207-dae2-494e-89e4-36aa6a97ee4f'
  AND slot_position = 1
  AND approval_status = 'approved';

-- 1.2 Garantir que Slot 2 do pedido específico NÃO seja vídeo principal
UPDATE pedido_videos
SET is_base_video = false,
    updated_at = now()
WHERE pedido_id = 'c0214207-dae2-494e-89e4-36aa6a97ee4f'
  AND slot_position = 2;

-- 1.3 REGRA GERAL: Fixar todos os pedidos que não têm vídeo principal
-- Atribuir is_base_video=true ao vídeo aprovado mais antigo
WITH pedidos_sem_principal AS (
  SELECT DISTINCT pedido_id
  FROM pedido_videos
  WHERE approval_status = 'approved'
  GROUP BY pedido_id
  HAVING SUM(CASE WHEN is_base_video THEN 1 ELSE 0 END) = 0
),
primeiro_aprovado AS (
  SELECT DISTINCT ON (pedido_id) 
    id,
    pedido_id
  FROM pedido_videos
  WHERE pedido_id IN (SELECT pedido_id FROM pedidos_sem_principal)
    AND approval_status = 'approved'
  ORDER BY pedido_id, created_at ASC
)
UPDATE pedido_videos
SET is_base_video = true,
    updated_at = now()
WHERE id IN (SELECT id FROM primeiro_aprovado);

-- ETAPA 2: Refatorar RPC set_base_video_enhanced
-- ========================================
-- Simplificar para gerenciar APENAS is_base_video, garantindo exatamente um por pedido

CREATE OR REPLACE FUNCTION public.set_base_video_enhanced(p_pedido_video_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pedido_id uuid;
  v_video_id uuid;
  v_approval_status text;
  v_video_nome text;
  v_current_principal_count int;
BEGIN
  -- 1️⃣ VALIDAR: Buscar dados do slot
  SELECT pedido_id, video_id, approval_status
  INTO v_pedido_id, v_video_id, v_approval_status
  FROM pedido_videos
  WHERE id = p_pedido_video_id;

  IF v_pedido_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Vídeo não encontrado'
    );
  END IF;

  IF v_approval_status != 'approved' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Vídeo deve estar aprovado para ser definido como principal'
    );
  END IF;

  -- 2️⃣ ATOMIC TRANSACTION: Trocar vídeo principal
  -- Desmarcar o vídeo principal anterior
  UPDATE pedido_videos
  SET is_base_video = false,
      updated_at = now()
  WHERE pedido_id = v_pedido_id
    AND is_base_video = true
    AND id != p_pedido_video_id;

  -- Marcar este slot como o novo vídeo principal
  UPDATE pedido_videos
  SET is_base_video = true,
      updated_at = now()
  WHERE id = p_pedido_video_id;

  -- 3️⃣ VALIDAÇÃO: Garantir que há exatamente um vídeo principal
  SELECT COUNT(*)
  INTO v_current_principal_count
  FROM pedido_videos
  WHERE pedido_id = v_pedido_id
    AND is_base_video = true;

  IF v_current_principal_count != 1 THEN
    RAISE EXCEPTION 'Inconsistência detectada: % vídeos principais encontrados', v_current_principal_count;
  END IF;

  -- 4️⃣ LOGGING
  SELECT nome INTO v_video_nome FROM videos WHERE id = v_video_id;
  
  RAISE NOTICE 'Vídeo principal alterado: pedido=%, video=% (%)', 
    v_pedido_id, v_video_id, v_video_nome;

  -- 5️⃣ RETORNAR SUCESSO
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Vídeo definido como principal',
    'timestamp', now()::text,
    'pedido_video_id', p_pedido_video_id,
    'video_id', v_video_id
  );
END;
$$;

COMMENT ON FUNCTION set_base_video_enhanced IS 
'Define um vídeo como principal (base) do pedido. Garante que sempre haverá EXATAMENTE um vídeo principal por pedido.';

-- ETAPA 3: Adicionar Trigger de Proteção
-- ========================================
-- Impedir remoção do último vídeo principal e garantir transferência automática

CREATE OR REPLACE FUNCTION protect_last_principal_video()
RETURNS TRIGGER AS $$
DECLARE
  v_remaining_approved int;
  v_has_other_principal boolean;
BEGIN
  -- Se está tentando deletar um vídeo principal aprovado
  IF TG_OP = 'DELETE' AND OLD.is_base_video = true AND OLD.approval_status = 'approved' THEN
    
    -- Verificar se há outros vídeos aprovados no pedido
    SELECT COUNT(*)
    INTO v_remaining_approved
    FROM pedido_videos
    WHERE pedido_id = OLD.pedido_id
      AND approval_status = 'approved'
      AND id != OLD.id;

    IF v_remaining_approved = 0 THEN
      RAISE EXCEPTION 'Não é possível remover o último vídeo principal aprovado do pedido. Envie outro vídeo primeiro.';
    END IF;

    -- Se há outros vídeos, promover o mais antigo a principal antes de deletar
    UPDATE pedido_videos
    SET is_base_video = true,
        updated_at = now()
    WHERE id = (
      SELECT id
      FROM pedido_videos
      WHERE pedido_id = OLD.pedido_id
        AND approval_status = 'approved'
        AND id != OLD.id
      ORDER BY created_at ASC
      LIMIT 1
    );

    RAISE NOTICE 'Vídeo principal transferido automaticamente antes da remoção';
  END IF;

  -- Se está tentando atualizar is_base_video de true para false
  IF TG_OP = 'UPDATE' AND OLD.is_base_video = true AND NEW.is_base_video = false THEN
    
    -- Verificar se há outro vídeo sendo promovido a principal
    SELECT EXISTS(
      SELECT 1
      FROM pedido_videos
      WHERE pedido_id = NEW.pedido_id
        AND is_base_video = true
        AND id != NEW.id
    ) INTO v_has_other_principal;

    IF NOT v_has_other_principal THEN
      RAISE NOTICE 'Impedindo remoção de is_base_video sem substituição - mantendo vídeo como principal';
      NEW.is_base_video := true;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_protect_last_principal ON pedido_videos;

CREATE TRIGGER trigger_protect_last_principal
  BEFORE UPDATE OR DELETE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION protect_last_principal_video();