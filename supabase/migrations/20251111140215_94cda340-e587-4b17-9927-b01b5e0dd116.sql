-- CORREÇÃO: Permitir troca automática de vídeo principal
-- Remove a validação que impede a troca via RPC set_base_video_enhanced

-- 1. Dropar trigger e função existentes
DROP TRIGGER IF EXISTS validate_base_video_rules_trigger ON pedido_videos;
DROP FUNCTION IF EXISTS validate_base_video_rules() CASCADE;

-- 2. Recriar função SEM a Regra 3 (múltiplos vídeos base)
-- A RPC set_base_video_enhanced já garante a troca atômica
CREATE OR REPLACE FUNCTION validate_base_video_rules()
RETURNS TRIGGER AS $$
DECLARE
  approved_count INTEGER;
BEGIN
  -- Regra 1: Ao marcar como base, garantir que selected_for_display e is_active sejam true
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.is_base_video = true THEN
    NEW.selected_for_display := true;
    NEW.is_active := true;
  END IF;
  
  -- Regra 2: BLOQUEAR remoção de is_base_video se for o único vídeo aprovado
  IF TG_OP = 'UPDATE' AND OLD.is_base_video = true AND NEW.is_base_video = false THEN
    SELECT COUNT(*) INTO approved_count
    FROM pedido_videos
    WHERE pedido_id = OLD.pedido_id
    AND approval_status = 'approved'
    AND id != OLD.id;
    
    IF approved_count = 0 THEN
      RAISE EXCEPTION 'Não é possível remover o último vídeo principal. Defina outro vídeo como principal primeiro.';
    END IF;
  END IF;
  
  -- Regra 3 REMOVIDA: A RPC set_base_video_enhanced gerencia a troca atômica
  -- Não há necessidade de validação duplicada aqui
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recriar trigger
CREATE TRIGGER validate_base_video_rules_trigger
BEFORE INSERT OR UPDATE ON pedido_videos
FOR EACH ROW
EXECUTE FUNCTION validate_base_video_rules();

-- Comentário explicativo
COMMENT ON FUNCTION validate_base_video_rules() IS 
'Valida regras básicas de vídeo principal:
1. Auto-define selected_for_display e is_active quando marcar como base
2. Impede remoção do último vídeo principal aprovado
A troca de vídeo principal é gerenciada pela RPC set_base_video_enhanced que faz swap atômico.';