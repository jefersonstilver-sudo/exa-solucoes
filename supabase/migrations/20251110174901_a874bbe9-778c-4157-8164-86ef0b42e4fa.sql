-- CORREÇÃO: Remover lógica automática de selected_for_display
-- O botão aprovar deve APENAS aprovar, sem definir vídeo principal automaticamente

-- Dropar o trigger que seta selected_for_display automaticamente
DROP TRIGGER IF EXISTS trigger_handle_video_approval ON pedido_videos;

-- Recriar a função SEM a lógica de selected_for_display
CREATE OR REPLACE FUNCTION auto_handle_video_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Apenas executar se está sendo aprovado AGORA
  IF NEW.approval_status = 'approved' AND 
     (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    
    RAISE NOTICE '[AUTO_HANDLE] Vídeo % do pedido % foi aprovado (sem auto-seleção)', NEW.id, NEW.pedido_id;
    
    -- NÃO mexer em selected_for_display, is_active ou is_base_video
    -- O cliente escolhe isso depois na interface de gerenciamento
    
    -- Apenas garantir que approved_at está setado
    IF NEW.approved_at IS NULL THEN
      NEW.approved_at := now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar trigger apenas para logar
CREATE TRIGGER trigger_handle_video_approval
  BEFORE UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION auto_handle_video_approval();

COMMENT ON FUNCTION auto_handle_video_approval() IS 
  'Apenas loga aprovação de vídeos. NÃO seta selected_for_display automaticamente - cliente escolhe depois';

COMMENT ON TRIGGER trigger_handle_video_approval ON pedido_videos IS 
  'Trigger que processa aprovação de vídeos sem auto-seleção';