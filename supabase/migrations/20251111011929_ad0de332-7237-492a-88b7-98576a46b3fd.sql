-- Migration para corrigir vídeos base em pedidos existentes
DO $$
DECLARE
  pedido_record RECORD;
  primeiro_video_id UUID;
  base_count INTEGER;
BEGIN
  FOR pedido_record IN 
    SELECT DISTINCT p.id as pedido_id
    FROM pedidos p
    WHERE p.status IN ('ativo', 'video_aprovado', 'pago_pendente_video', 'video_enviado', 'pago')
  LOOP
    SELECT COUNT(*) INTO base_count
    FROM pedido_videos
    WHERE pedido_id = pedido_record.pedido_id
    AND is_base_video = true;
    
    IF base_count != 1 THEN
      SELECT pv.id INTO primeiro_video_id
      FROM pedido_videos pv
      WHERE pv.pedido_id = pedido_record.pedido_id
      AND pv.approval_status = 'approved'
      ORDER BY pv.created_at ASC
      LIMIT 1;
      
      IF primeiro_video_id IS NOT NULL THEN
        UPDATE pedido_videos
        SET is_base_video = false, updated_at = now()
        WHERE pedido_id = pedido_record.pedido_id;
        
        UPDATE pedido_videos
        SET 
          is_base_video = true,
          selected_for_display = true,
          updated_at = now()
        WHERE id = primeiro_video_id;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Trigger para garantir automaticamente que o primeiro vídeo aprovado seja o vídeo base
CREATE OR REPLACE FUNCTION ensure_base_video_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  base_video_count INTEGER;
BEGIN
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    SELECT COUNT(*) INTO base_video_count
    FROM pedido_videos
    WHERE pedido_id = NEW.pedido_id
    AND is_base_video = true
    AND id != NEW.id;
    
    IF base_video_count = 0 THEN
      NEW.is_base_video := true;
      NEW.selected_for_display := true;
    ELSE
      NEW.is_base_video := false;
      NEW.selected_for_display := false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_base_video_on_approval_trigger ON pedido_videos;

CREATE TRIGGER ensure_base_video_on_approval_trigger
BEFORE UPDATE ON pedido_videos
FOR EACH ROW
EXECUTE FUNCTION ensure_base_video_on_approval();

-- Função para validar que apenas 1 vídeo seja base por pedido
CREATE OR REPLACE FUNCTION validate_single_base_video()
RETURNS TRIGGER AS $$
DECLARE
  base_count INTEGER;
BEGIN
  IF NEW.is_base_video = true THEN
    SELECT COUNT(*) INTO base_count
    FROM pedido_videos
    WHERE pedido_id = NEW.pedido_id
    AND is_base_video = true
    AND id != NEW.id;
    
    IF base_count > 0 THEN
      UPDATE pedido_videos
      SET 
        is_base_video = false,
        updated_at = now()
      WHERE pedido_id = NEW.pedido_id
      AND id != NEW.id
      AND is_base_video = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_single_base_video_trigger ON pedido_videos;

CREATE TRIGGER validate_single_base_video_trigger
BEFORE INSERT OR UPDATE ON pedido_videos
FOR EACH ROW
WHEN (NEW.is_base_video = true)
EXECUTE FUNCTION validate_single_base_video();