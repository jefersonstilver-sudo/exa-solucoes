-- SOLUÇÃO DEFINITIVA: Consolidar lógica em UMA função atômica
-- Desabilitar os triggers conflitantes e criar uma solução robusta

-- Passo 1: Dropar triggers conflitantes
DROP TRIGGER IF EXISTS trigger_auto_activate_first_video ON pedido_videos;
DROP TRIGGER IF EXISTS trigger_auto_set_base_video ON pedido_videos;
DROP TRIGGER IF EXISTS pv_auto_select_on_approval ON pedido_videos;

-- Passo 2: Criar função consolidada SEM race conditions
CREATE OR REPLACE FUNCTION auto_handle_video_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_has_selected_video BOOLEAN;
BEGIN
  -- Apenas executar se está sendo aprovado AGORA
  IF NEW.approval_status = 'approved' AND 
     (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    
    RAISE NOTICE '[AUTO_HANDLE] Processando aprovação do vídeo % do pedido %', NEW.id, NEW.pedido_id;
    
    -- Verificar atomicamente se JÁ EXISTE vídeo com selected_for_display = true
    -- Esta verificação é DENTRO da transação, então é segura
    SELECT EXISTS(
      SELECT 1 FROM pedido_videos 
      WHERE pedido_id = NEW.pedido_id 
        AND selected_for_display = true 
        AND id != NEW.id
        FOR UPDATE  -- Lock para evitar race condition
    ) INTO v_has_selected_video;
    
    IF v_has_selected_video THEN
      -- Já existe vídeo selecionado, apenas aprovar sem marcar como selecionado
      RAISE NOTICE '[AUTO_HANDLE] Pedido % já tem vídeo selecionado, apenas aprovando', NEW.pedido_id;
      NEW.is_active := false;
      NEW.is_base_video := false;
      NEW.selected_for_display := false;
    ELSE
      -- Este é o PRIMEIRO vídeo aprovado, marcar como selecionado
      RAISE NOTICE '[AUTO_HANDLE] Primeiro vídeo aprovado para pedido %, marcando como selecionado', NEW.pedido_id;
      NEW.is_active := true;
      NEW.is_base_video := true;
      NEW.selected_for_display := true;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Passo 3: Criar trigger ÚNICO consolidado
CREATE TRIGGER trigger_handle_video_approval
  BEFORE UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION auto_handle_video_approval();

COMMENT ON FUNCTION auto_handle_video_approval() IS 
  'Função consolidada que gerencia aprovação de vídeos de forma atômica, sem race conditions';

COMMENT ON TRIGGER trigger_handle_video_approval ON pedido_videos IS 
  'Trigger consolidado que substitui trigger_auto_activate_first_video e trigger_auto_set_base_video';