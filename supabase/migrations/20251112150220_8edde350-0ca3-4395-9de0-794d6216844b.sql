-- ============================================================================
-- CORREÇÃO CONSOLIDADA: Integridade de Exibição de Vídeos
-- ============================================================================
-- Corrige problema de múltiplos vídeos em exibição por pedido
-- Garante: 1 pedido = 1 vídeo em exibição (exceto durante agendamentos ativos)
-- ============================================================================

-- ETAPA 1: LIMPEZA DE DADOS CORROMPIDOS
-- ============================================================================

-- 1.1: Garantir apenas 1 vídeo com selected_for_display=true por pedido
-- Prioriza: is_base_video=true, depois mais recente
UPDATE pedido_videos pv1
SET 
  selected_for_display = false,
  is_active = false,
  updated_at = now()
FROM (
  SELECT DISTINCT ON (pedido_id) 
    pedido_id, 
    id
  FROM pedido_videos
  WHERE selected_for_display = true
    AND is_active = true
    AND approval_status = 'approved'
  ORDER BY pedido_id, 
    CASE WHEN is_base_video THEN 0 ELSE 1 END,
    updated_at DESC
) pv2
WHERE pv1.pedido_id = pv2.pedido_id
  AND pv1.id != pv2.id
  AND pv1.selected_for_display = true;

-- 1.2: Remover agendamentos órfãos (sem regras de schedule)
DELETE FROM campaign_video_schedules cvs
WHERE NOT EXISTS (
  SELECT 1 FROM campaign_schedule_rules csr
  WHERE csr.campaign_video_schedule_id = cvs.id
);

-- ============================================================================
-- ETAPA 2: CORRIGIR FUNÇÃO safe_set_base_video
-- ============================================================================

-- Drop função existente
DROP FUNCTION IF EXISTS safe_set_base_video(UUID);

-- Recriar com correções
CREATE OR REPLACE FUNCTION safe_set_base_video(p_slot_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id UUID;
  v_video_name TEXT;
  v_result json;
BEGIN
  -- Sinalizar contexto RPC para bypass de triggers
  PERFORM set_config('app.in_rpc_context', 'true', true);

  -- Buscar pedido_id e nome do vídeo
  SELECT pv.pedido_id, v.nome 
  INTO v_pedido_id, v_video_name
  FROM pedido_videos pv
  JOIN videos v ON v.id = pv.video_id
  WHERE pv.id = p_slot_id;

  IF v_pedido_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Slot não encontrado'
    );
  END IF;

  -- ⭐ CRITICAL FIX: Desmarcar TODOS os flags dos outros vídeos
  UPDATE public.pedido_videos
  SET 
    is_base_video = false,
    selected_for_display = false,  -- NOVO: Evita duplicidade de exibição
    is_active = false,              -- NOVO: Garante apenas 1 ativo
    updated_at = now()
  WHERE pedido_id = v_pedido_id 
    AND id != p_slot_id;

  -- Marcar o novo vídeo base
  UPDATE public.pedido_videos
  SET 
    is_base_video = true,
    selected_for_display = true,
    is_active = true,
    approval_status = 'approved',
    approved_at = COALESCE(approved_at, now()),
    updated_at = now()
  WHERE id = p_slot_id;

  -- Resetar flag de contexto RPC
  PERFORM set_config('app.in_rpc_context', 'false', true);

  RETURN json_build_object(
    'success', true,
    'video_name', v_video_name
  );
EXCEPTION
  WHEN OTHERS THEN
    PERFORM set_config('app.in_rpc_context', 'false', true);
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

COMMENT ON FUNCTION safe_set_base_video IS 'Define vídeo base e garante que apenas 1 vídeo fique em exibição por pedido';

-- ============================================================================
-- ETAPA 3: ADICIONAR TRIGGER DE INTEGRIDADE
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_single_display_video()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ⭐ Bypassar validação se estiver em contexto RPC
  -- (RPCs como safe_set_base_video já fazem a validação internamente)
  IF current_setting('app.in_rpc_context', true) = 'true' THEN
    RETURN NEW;
  END IF;
  
  -- Se estiver marcando vídeo como exibição ativa
  IF NEW.selected_for_display = true AND NEW.is_active = true THEN
    -- Desmarcar automaticamente TODOS os outros vídeos do mesmo pedido
    UPDATE pedido_videos
    SET 
      selected_for_display = false,
      is_active = false,
      is_base_video = false,
      updated_at = now()
    WHERE pedido_id = NEW.pedido_id
      AND id != NEW.id
      AND selected_for_display = true;
    
    RAISE NOTICE 'Outros vídeos do pedido % foram desmarcados automaticamente', NEW.pedido_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger em INSERT e UPDATE
DROP TRIGGER IF EXISTS enforce_single_display_video ON pedido_videos;
CREATE TRIGGER enforce_single_display_video
  BEFORE INSERT OR UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION validate_single_display_video();

COMMENT ON FUNCTION validate_single_display_video IS 'Garante que apenas 1 vídeo por pedido tenha selected_for_display=true';

-- ============================================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ============================================================================

-- Verificar se há pedidos com múltiplos vídeos em exibição
DO $$
DECLARE
  v_duplicates INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_duplicates
  FROM (
    SELECT pedido_id, COUNT(*) as video_count
    FROM pedido_videos
    WHERE selected_for_display = true 
      AND is_active = true
    GROUP BY pedido_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF v_duplicates > 0 THEN
    RAISE WARNING 'ATENÇÃO: % pedidos ainda têm múltiplos vídeos em exibição!', v_duplicates;
  ELSE
    RAISE NOTICE '✅ Migração concluída: Todos os pedidos têm apenas 1 vídeo em exibição';
  END IF;
END;
$$;