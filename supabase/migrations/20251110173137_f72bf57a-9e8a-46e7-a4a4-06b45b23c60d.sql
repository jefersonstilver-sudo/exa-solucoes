-- Corrigir função do trigger para verificar selected_for_display também

CREATE OR REPLACE FUNCTION auto_set_first_approved_video_as_base_safe()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_trigger_depth INTEGER;
  v_has_selected_video BOOLEAN;
BEGIN
  -- Verificar profundidade de recursão
  BEGIN
    v_trigger_depth := current_setting('myapp.trigger_depth')::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    v_trigger_depth := 0;
  END;
  
  -- Se já estamos em trigger, não fazer nada
  IF v_trigger_depth > 0 THEN
    RETURN NEW;
  END IF;
  
  -- Marcar que estamos em trigger
  PERFORM set_config('myapp.trigger_depth', '1', true);
  
  -- CRÍTICO: Verificar se o pedido JÁ TEM vídeo com selected_for_display = true
  SELECT EXISTS(
    SELECT 1 FROM pedido_videos 
    WHERE pedido_id = NEW.pedido_id 
      AND selected_for_display = true 
      AND id != NEW.id
  ) INTO v_has_selected_video;
  
  -- Se não tem vídeo selecionado e este é aprovado, torná-lo base
  IF NOT v_has_selected_video AND NEW.approval_status = 'approved' THEN
    RAISE NOTICE '[TRIGGER] Marcando primeiro vídeo aprovado como base para pedido %', NEW.pedido_id;
    NEW.is_base_video := true;
    NEW.selected_for_display := true;
    NEW.is_active := true;
  ELSE
    RAISE NOTICE '[TRIGGER] Pedido % já tem vídeo selecionado, não marcar automaticamente', NEW.pedido_id;
  END IF;
  
  -- Resetar flag
  PERFORM set_config('myapp.trigger_depth', '0', true);
  
  RETURN NEW;
END;
$$;