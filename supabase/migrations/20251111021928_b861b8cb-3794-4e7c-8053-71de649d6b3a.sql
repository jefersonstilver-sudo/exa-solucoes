
-- Remover trigger problemático e recriar sem forçar flags
DROP TRIGGER IF EXISTS trigger_validate_base_video ON pedido_videos;
DROP FUNCTION IF EXISTS validate_base_video_changes();

-- Nova função que apenas valida, não altera
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
  
  -- Não forçar nenhuma flag, apenas retornar o NEW sem alterações
  RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER trigger_validate_base_video
  BEFORE UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION validate_base_video_changes();

-- Corrigir o vídeo do Slot 1 agora que o trigger não força mais as flags
UPDATE pedido_videos
SET 
  is_base_video = true,
  updated_at = now()
WHERE pedido_id = 'c0214207-dae2-494e-89e4-36aa6a97ee4f'
  AND slot_position = 1;
