-- FASE 1: Limpeza de dados duplicados
-- Desativar vídeos secundários que não deveriam estar ativos
UPDATE pedido_videos
SET is_active = false
WHERE is_active = true
  AND selected_for_display = false
  AND is_base_video = false
  AND approval_status = 'approved';

-- FASE 2: Criar trigger para garantir apenas 1 vídeo ativo por pedido
CREATE OR REPLACE FUNCTION enforce_single_active_video_per_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se está marcando como ativo/base/selecionado, desativar todos os outros do mesmo pedido
  IF (NEW.is_active = true OR NEW.is_base_video = true OR NEW.selected_for_display = true) THEN
    UPDATE pedido_videos
    SET 
      is_active = false,
      is_base_video = false,
      selected_for_display = false
    WHERE pedido_id = NEW.pedido_id
      AND id != NEW.id
      AND (is_active = true OR is_base_video = true OR selected_for_display = true);
      
    -- Garantir que o novo registro tenha apenas um flag ativo
    IF NEW.is_base_video = true OR NEW.selected_for_display = true THEN
      NEW.is_active := true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger BEFORE para garantir unicidade
DROP TRIGGER IF EXISTS trigger_enforce_single_active_video ON pedido_videos;
CREATE TRIGGER trigger_enforce_single_active_video
BEFORE UPDATE OR INSERT ON pedido_videos
FOR EACH ROW
EXECUTE FUNCTION enforce_single_active_video_per_order();