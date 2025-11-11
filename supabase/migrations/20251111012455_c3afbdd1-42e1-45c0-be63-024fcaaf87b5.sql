-- CORREÇÃO DE EMERGÊNCIA: Desabilitar triggers temporariamente e forçar vídeo base

-- 1. Desabilitar triggers temporariamente
ALTER TABLE pedido_videos DISABLE TRIGGER validate_single_base_video_trigger;
ALTER TABLE pedido_videos DISABLE TRIGGER ensure_base_video_on_approval_trigger;

-- 2. Forçar correção do pedido específico
UPDATE pedido_videos
SET 
  is_base_video = true,
  updated_at = now()
WHERE id = 'ce3f619c-7b6b-47a8-a7a9-295786950094';

-- 3. Garantir que o outro vídeo NÃO é base
UPDATE pedido_videos
SET 
  is_base_video = false,
  updated_at = now()
WHERE id = 'a84d4414-e647-4f64-9da0-d919213b5959';

-- 4. Reabilitar apenas o trigger de aprovação (mais seguro)
ALTER TABLE pedido_videos ENABLE TRIGGER ensure_base_video_on_approval_trigger;

-- 5. REMOVER COMPLETAMENTE o trigger problemático
DROP TRIGGER IF EXISTS validate_single_base_video_trigger ON pedido_videos;

-- 6. Criar um novo trigger que NUNCA remove is_base_video automaticamente
-- Apenas valida que não pode ter 2 bases ao mesmo tempo
CREATE OR REPLACE FUNCTION prevent_multiple_base_videos()
RETURNS TRIGGER AS $$
DECLARE
  base_count INTEGER;
BEGIN
  -- Se está tentando marcar como vídeo base
  IF NEW.is_base_video = true AND (OLD.is_base_video IS NULL OR OLD.is_base_video = false) THEN
    -- Contar se já existe outro vídeo base
    SELECT COUNT(*) INTO base_count
    FROM pedido_videos
    WHERE pedido_id = NEW.pedido_id
    AND is_base_video = true
    AND id != NEW.id;
    
    -- Se já existe, BLOQUEAR a operação (não permitir 2 bases)
    IF base_count > 0 THEN
      RAISE EXCEPTION 'Já existe um vídeo principal para este pedido. Remova a marcação do vídeo principal atual antes de definir outro.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_multiple_base_videos_trigger
BEFORE INSERT OR UPDATE ON pedido_videos
FOR EACH ROW
WHEN (NEW.is_base_video = true)
EXECUTE FUNCTION prevent_multiple_base_videos();