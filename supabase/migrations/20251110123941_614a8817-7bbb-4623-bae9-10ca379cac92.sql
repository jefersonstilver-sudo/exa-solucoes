-- Criar função para definir automaticamente o primeiro vídeo aprovado como base
CREATE OR REPLACE FUNCTION auto_set_first_approved_video_as_base()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_base_video BOOLEAN;
BEGIN
  -- Verificar se o vídeo está sendo aprovado
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    
    -- Verificar se já existe um vídeo base para este pedido
    SELECT EXISTS (
      SELECT 1 
      FROM pedido_videos 
      WHERE pedido_id = NEW.pedido_id 
        AND is_base_video = true
        AND id != NEW.id
    ) INTO v_has_base_video;
    
    -- Se não houver vídeo base, definir este como base automaticamente
    IF NOT v_has_base_video THEN
      RAISE NOTICE '🎯 AUTO_BASE: Definindo primeiro vídeo aprovado como base para pedido %', NEW.pedido_id;
      
      -- Definir como base, selecionado e ativo
      NEW.is_base_video := true;
      NEW.selected_for_display := true;
      NEW.is_active := true;
      
      RAISE NOTICE '✅ AUTO_BASE: Vídeo % definido como base automaticamente', NEW.id;
    ELSE
      RAISE NOTICE 'ℹ️ AUTO_BASE: Já existe vídeo base para pedido %, não alterando', NEW.pedido_id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar antes do update
DROP TRIGGER IF EXISTS trigger_auto_set_base_video ON pedido_videos;
CREATE TRIGGER trigger_auto_set_base_video
  BEFORE UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_first_approved_video_as_base();

-- Comentário explicativo
COMMENT ON FUNCTION auto_set_first_approved_video_as_base() IS 
'Automaticamente define o primeiro vídeo aprovado de um pedido como vídeo base (principal). 
Garante que sempre haja um vídeo em exibição. Executa apenas quando não existe vídeo base para o pedido.';