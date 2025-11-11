-- Garantir que apenas 1 vídeo por pedido tenha selected_for_display = true
-- Esta migration cria um trigger que automaticamente desmarca outros vídeos
-- quando um novo vídeo é marcado como selected_for_display

-- Função para garantir único selected_for_display
CREATE OR REPLACE FUNCTION ensure_single_selected_for_display()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o vídeo está sendo marcado como selected_for_display = true
  IF NEW.selected_for_display = true THEN
    -- Desmarcar todos os outros vídeos do mesmo pedido
    UPDATE pedido_videos 
    SET 
      selected_for_display = false,
      updated_at = now()
    WHERE pedido_id = NEW.pedido_id
      AND id != NEW.id
      AND selected_for_display = true;
    
    -- Log para debug
    RAISE NOTICE 'Vídeo % marcado para exibição no pedido %. Outros vídeos desmarcados.', NEW.video_id, NEW.pedido_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger que executa ANTES de UPDATE
CREATE TRIGGER ensure_single_selected_for_display_trigger
BEFORE UPDATE ON pedido_videos
FOR EACH ROW
WHEN (NEW.selected_for_display = true AND OLD.selected_for_display IS DISTINCT FROM NEW.selected_for_display)
EXECUTE FUNCTION ensure_single_selected_for_display();

-- Comentário explicativo
COMMENT ON FUNCTION ensure_single_selected_for_display() IS 
'Garante que apenas 1 vídeo por pedido tenha selected_for_display = true. Quando um vídeo é marcado, todos os outros do mesmo pedido são desmarcados automaticamente.';