-- CORREÇÃO DEFINITIVA: Criar trigger que IMPEDE remoção de is_base_video do último vídeo base

-- 1. Criar função que protege o último vídeo base
CREATE OR REPLACE FUNCTION protect_last_base_video()
RETURNS TRIGGER AS $$
DECLARE
  base_count INTEGER;
BEGIN
  -- Se está tentando REMOVER is_base_video (mudar de true para false)
  IF OLD.is_base_video = true AND NEW.is_base_video = false THEN
    -- Contar quantos outros vídeos base existem neste pedido
    SELECT COUNT(*) INTO base_count
    FROM pedido_videos
    WHERE pedido_id = OLD.pedido_id
    AND is_base_video = true
    AND id != OLD.id;
    
    -- Se não existe outro vídeo base, BLOQUEAR a remoção
    IF base_count = 0 THEN
      RAISE EXCEPTION 'Não é possível remover o último vídeo principal do pedido. Defina outro vídeo como principal primeiro.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger
DROP TRIGGER IF EXISTS protect_last_base_video_trigger ON pedido_videos;

CREATE TRIGGER protect_last_base_video_trigger
BEFORE UPDATE ON pedido_videos
FOR EACH ROW
WHEN (OLD.is_base_video = true AND NEW.is_base_video = false)
EXECUTE FUNCTION protect_last_base_video();

-- 3. FORÇAR correção do pedido AGORA
UPDATE pedido_videos
SET is_base_video = true
WHERE id = 'ce3f619c-7b6b-47a8-a7a9-295786950094';