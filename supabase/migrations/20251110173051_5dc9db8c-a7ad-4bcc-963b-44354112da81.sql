-- Corrigir trigger para disparar em UPDATE também (quando o vídeo é aprovado)

-- 1. Remover trigger antigo
DROP TRIGGER IF EXISTS trigger_auto_set_base_video ON pedido_videos;

-- 2. Recriar trigger para INSERT e UPDATE
CREATE TRIGGER trigger_auto_set_base_video
  BEFORE INSERT OR UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_first_approved_video_as_base_safe();

-- 3. Log para confirmar
DO $$
BEGIN
  RAISE NOTICE 'Trigger trigger_auto_set_base_video recriado para INSERT e UPDATE';
END $$;