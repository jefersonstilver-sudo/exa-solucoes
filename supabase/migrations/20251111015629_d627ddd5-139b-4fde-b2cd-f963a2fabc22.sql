
-- ============================================================================
-- CORREÇÃO: PERMITIR DESATIVAR VÍDEO BASE QUANDO HÁ AGENDADO ATIVO
-- ============================================================================

-- Remover o trigger que impede desativação do vídeo base
DROP TRIGGER IF EXISTS trigger_protect_base_video ON pedido_videos;
DROP FUNCTION IF EXISTS protect_base_video_from_deactivation();

-- Criar nova função que valida regras de vídeo base
CREATE OR REPLACE FUNCTION validate_base_video_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Impedir REMOÇÃO da flag is_base_video se for o único vídeo aprovado
  IF OLD.is_base_video = true AND NEW.is_base_video = false THEN
    IF NOT EXISTS (
      SELECT 1 FROM pedido_videos
      WHERE pedido_id = NEW.pedido_id
        AND approval_status = 'approved'
        AND video_id != NEW.video_id
    ) THEN
      RAISE EXCEPTION 'Não é possível remover a marcação de vídeo base do único vídeo aprovado';
    END IF;
  END IF;
  
  -- Garantir que vídeo base sempre tenha as flags corretas quando marcado
  IF NEW.is_base_video = true THEN
    NEW.is_active := true;
    NEW.selected_for_display := true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para validar mudanças no vídeo base
CREATE TRIGGER trigger_validate_base_video
  BEFORE UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION validate_base_video_changes();
