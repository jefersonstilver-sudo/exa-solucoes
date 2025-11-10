-- FASE 1: Limpar Estado Inconsistente no Banco
-- Garantir que cada pedido tenha APENAS 1 vídeo com selected_for_display e 1 com is_base_video

-- Corrigir duplicações mantendo apenas o vídeo base (ou primeiro aprovado)
WITH base_videos AS (
  SELECT DISTINCT ON (pedido_id)
    id,
    pedido_id
  FROM pedido_videos
  WHERE approval_status = 'approved'
  ORDER BY pedido_id, 
           is_base_video DESC, 
           slot_position ASC
)
UPDATE pedido_videos pv
SET 
  selected_for_display = (pv.id IN (SELECT id FROM base_videos)),
  is_base_video = (pv.id IN (SELECT id FROM base_videos)),
  is_active = (pv.id IN (SELECT id FROM base_videos)),
  updated_at = NOW()
WHERE pedido_id IN (
  SELECT pedido_id FROM pedido_videos 
  WHERE selected_for_display = true 
  GROUP BY pedido_id 
  HAVING COUNT(*) > 1
);

-- FASE 2: Criar Constraints de Proteção
-- Garantir apenas 1 selected_for_display por pedido
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_selected_per_pedido 
ON pedido_videos (pedido_id) 
WHERE selected_for_display = true;

-- Garantir apenas 1 is_base_video por pedido
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_base_per_pedido 
ON pedido_videos (pedido_id) 
WHERE is_base_video = true;

-- FASE 3: Recriar Funções com Anti-Recursão

-- Função segura para enforce_single_base_video
CREATE OR REPLACE FUNCTION enforce_single_base_video_safe()
RETURNS TRIGGER AS $$
DECLARE
  v_trigger_depth INTEGER;
BEGIN
  -- Verificar profundidade de recursão
  BEGIN
    v_trigger_depth := current_setting('myapp.trigger_depth')::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    v_trigger_depth := 0;
  END;
  
  -- Se já estamos em trigger, não fazer nada (evita recursão)
  IF v_trigger_depth > 0 THEN
    RETURN NEW;
  END IF;
  
  -- Marcar que estamos em trigger
  PERFORM set_config('myapp.trigger_depth', '1', true);
  
  -- APENAS VALIDAR, NÃO FAZER UPDATEs em outros registros!
  -- O UNIQUE INDEX já previne duplicações automaticamente
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.is_base_video = true THEN
    NEW.selected_for_display := true;
    NEW.is_active := true;
  END IF;
  
  -- Resetar flag
  PERFORM set_config('myapp.trigger_depth', '0', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função segura para auto_set_first_approved_video_as_base
CREATE OR REPLACE FUNCTION auto_set_first_approved_video_as_base_safe()
RETURNS TRIGGER AS $$
DECLARE
  v_trigger_depth INTEGER;
  v_has_base_video BOOLEAN;
BEGIN
  -- Verificar profundidade de recursão
  BEGIN
    v_trigger_depth := current_setting('myapp.trigger_depth')::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    v_trigger_depth := 0;
  END;
  
  -- Se já estamos em trigger, não fazer nada
  IF v_trigger_depth > 0 THEN
    RETURN NEW;
  END IF;
  
  -- Marcar que estamos em trigger
  PERFORM set_config('myapp.trigger_depth', '1', true);
  
  -- Verificar se o pedido já tem vídeo base
  SELECT EXISTS(
    SELECT 1 FROM pedido_videos 
    WHERE pedido_id = NEW.pedido_id 
      AND is_base_video = true 
      AND id != NEW.id
  ) INTO v_has_base_video;
  
  -- Se não tem vídeo base e este é aprovado, torná-lo base
  IF NOT v_has_base_video AND NEW.approval_status = 'approved' THEN
    NEW.is_base_video := true;
    NEW.selected_for_display := true;
    NEW.is_active := true;
  END IF;
  
  -- Resetar flag
  PERFORM set_config('myapp.trigger_depth', '0', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar triggers com funções seguras
DROP TRIGGER IF EXISTS trigger_enforce_single_base_video ON pedido_videos;
CREATE TRIGGER trigger_enforce_single_base_video
  BEFORE INSERT OR UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_base_video_safe();

DROP TRIGGER IF EXISTS pv_auto_select_on_approval_trg ON pedido_videos;
CREATE TRIGGER pv_auto_select_on_approval_trg
  BEFORE INSERT OR UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_first_approved_video_as_base_safe();