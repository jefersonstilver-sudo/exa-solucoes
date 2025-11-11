-- SOLUÇÃO DEFINITIVA: Remover triggers conflitantes e criar lógica simples

-- 1. REMOVER todos os triggers problemáticos que causam conflitos
DROP TRIGGER IF EXISTS enforce_single_base_video_trigger ON pedido_videos;
DROP TRIGGER IF EXISTS enforce_single_base_video_safe_trigger ON pedido_videos;
DROP TRIGGER IF EXISTS protect_last_base_video_trigger ON pedido_videos;
DROP TRIGGER IF EXISTS ensure_base_video_on_approval_trigger ON pedido_videos;
DROP TRIGGER IF EXISTS prevent_multiple_base_videos_trigger ON pedido_videos;

DROP FUNCTION IF EXISTS enforce_single_base_video() CASCADE;
DROP FUNCTION IF EXISTS enforce_single_base_video_safe() CASCADE;
DROP FUNCTION IF EXISTS protect_last_base_video() CASCADE;
DROP FUNCTION IF EXISTS ensure_base_video_on_approval() CASCADE;
DROP FUNCTION IF EXISTS prevent_multiple_base_videos() CASCADE;

-- 2. Criar função SIMPLES que APENAS valida (não tenta ser inteligente)
CREATE OR REPLACE FUNCTION validate_base_video_rules()
RETURNS TRIGGER AS $$
DECLARE
  base_count INTEGER;
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
  
  -- Regra 3: BLOQUEAR criação de múltiplos vídeos base no mesmo pedido
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.is_base_video = true THEN
    SELECT COUNT(*) INTO base_count
    FROM pedido_videos
    WHERE pedido_id = NEW.pedido_id
    AND is_base_video = true
    AND id != NEW.id
    AND approval_status = 'approved';
    
    IF base_count > 0 THEN
      RAISE EXCEPTION 'Já existe um vídeo principal neste pedido. Remova o anterior antes de definir um novo.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar trigger simples
CREATE TRIGGER validate_base_video_rules_trigger
BEFORE INSERT OR UPDATE ON pedido_videos
FOR EACH ROW
EXECUTE FUNCTION validate_base_video_rules();

-- 4. Criar função para garantir vídeo base ao aprovar (apenas se não existir)
CREATE OR REPLACE FUNCTION auto_assign_base_video_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  base_count INTEGER;
BEGIN
  -- Apenas quando aprovar um vídeo
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    -- Verificar se já existe vídeo base
    SELECT COUNT(*) INTO base_count
    FROM pedido_videos
    WHERE pedido_id = NEW.pedido_id
    AND is_base_video = true
    AND id != NEW.id;
    
    -- Se não existe, este será o base
    IF base_count = 0 THEN
      NEW.is_base_video := true;
      NEW.selected_for_display := true;
      NEW.is_active := true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_base_video_trigger
BEFORE INSERT OR UPDATE ON pedido_videos
FOR EACH ROW
EXECUTE FUNCTION auto_assign_base_video_on_approval();

-- 5. CORRIGIR o estado atual do pedido problemático
UPDATE pedido_videos
SET 
  is_base_video = true,
  selected_for_display = true,
  is_active = true,
  updated_at = NOW()
WHERE id = 'ce3f619c-7b6b-47a8-a7a9-295786950094';

UPDATE pedido_videos
SET 
  is_base_video = false,
  selected_for_display = false,
  is_active = false,
  updated_at = NOW()
WHERE id = 'a84d4414-e647-4f64-9da0-d919213b5959';