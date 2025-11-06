-- Função para ativar automaticamente o primeiro vídeo aprovado de um pedido
CREATE OR REPLACE FUNCTION auto_activate_first_video()
RETURNS TRIGGER AS $$
DECLARE
  approved_count INTEGER;
BEGIN
  -- Só executa se o status mudou para 'approved'
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    
    -- Conta quantos vídeos aprovados existem para este pedido
    SELECT COUNT(*) INTO approved_count
    FROM pedido_videos
    WHERE pedido_id = NEW.pedido_id 
      AND approval_status = 'approved';
    
    -- Se este é o PRIMEIRO vídeo aprovado, ativa automaticamente
    IF approved_count = 1 THEN
      NEW.selected_for_display := true;
      NEW.is_active := true;
      
      -- Log do evento
      RAISE NOTICE 'AUTO-ATIVAÇÃO: Primeiro vídeo aprovado (%) do pedido (%) foi automaticamente ativado para exibição', 
        NEW.id, NEW.pedido_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger BEFORE UPDATE
DROP TRIGGER IF EXISTS trigger_auto_activate_first_video ON pedido_videos;
CREATE TRIGGER trigger_auto_activate_first_video
  BEFORE UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_first_video();

-- Comentários
COMMENT ON FUNCTION auto_activate_first_video() IS 
  'Ativa automaticamente o primeiro vídeo aprovado de um pedido para exibição imediata';
COMMENT ON TRIGGER trigger_auto_activate_first_video ON pedido_videos IS 
  'Garante que o primeiro vídeo aprovado de qualquer pedido entre em exibição automaticamente';

-- Função para atualizar status do pedido quando vídeo é aprovado
CREATE OR REPLACE FUNCTION update_order_status_on_video_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Só executa se o status mudou para 'approved'
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    
    -- Atualizar status do pedido para 'video_aprovado'
    UPDATE pedidos 
    SET status = 'video_aprovado',
        updated_at = NOW()
    WHERE id = NEW.pedido_id 
      AND status IN ('pago_pendente_video', 'video_enviado');
    
    -- Log do evento
    RAISE NOTICE 'STATUS ATUALIZADO: Pedido (%) atualizado para video_aprovado após aprovação do vídeo (%)', 
      NEW.pedido_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger AFTER UPDATE
DROP TRIGGER IF EXISTS trigger_update_order_status ON pedido_videos;
CREATE TRIGGER trigger_update_order_status
  AFTER UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_on_video_approval();

-- Comentários
COMMENT ON FUNCTION update_order_status_on_video_approval() IS 
  'Atualiza automaticamente o status do pedido para video_aprovado quando um vídeo é aprovado';
COMMENT ON TRIGGER trigger_update_order_status ON pedido_videos IS 
  'Sincroniza o status do pedido com a aprovação de vídeos';