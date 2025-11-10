-- FASE 1: Eliminar trigger conflitante
-- Dropar o trigger redundante que causa conflito na flag compartilhada
DROP TRIGGER IF EXISTS trigger_enforce_single_base_video ON pedido_videos;

-- Dropar a função associada
DROP FUNCTION IF EXISTS enforce_single_base_video_per_order();

-- FASE 2 e 3: Recriar função com logs detalhados e verificações de idempotência
CREATE OR REPLACE FUNCTION auto_set_first_approved_video_as_base_safe()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_trigger_depth INTEGER;
  v_has_selected_video BOOLEAN;
BEGIN
  -- Log inicial
  RAISE NOTICE '[TRIGGER_DEBUG] ==== INÍCIO TRIGGER ====';
  RAISE NOTICE '[TRIGGER_DEBUG] Vídeo ID: %, Status: % -> %, Pedido: %', 
    NEW.id, OLD.approval_status, NEW.approval_status, NEW.pedido_id;
  RAISE NOTICE '[TRIGGER_DEBUG] selected_for_display: % -> %', 
    OLD.selected_for_display, NEW.selected_for_display;
  
  -- IDEMPOTÊNCIA 1: Se já está com selected_for_display = true, não fazer nada
  IF NEW.selected_for_display = true THEN
    RAISE NOTICE '[TRIGGER_DEBUG] Vídeo já está com selected_for_display=true, pulando';
    RETURN NEW;
  END IF;
  
  -- IDEMPOTÊNCIA 2: Se já estava aprovado, não executar lógica
  IF OLD.approval_status = 'approved' THEN
    RAISE NOTICE '[TRIGGER_DEBUG] Vídeo já estava aprovado, pulando';
    RETURN NEW;
  END IF;
  
  -- IDEMPOTÊNCIA 3: Se não está sendo aprovado agora, não fazer nada
  IF NEW.approval_status != 'approved' THEN
    RAISE NOTICE '[TRIGGER_DEBUG] Status não é "approved", pulando';
    RETURN NEW;
  END IF;
  
  -- Verificar profundidade de recursão
  BEGIN
    v_trigger_depth := current_setting('myapp.trigger_depth')::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    v_trigger_depth := 0;
  END;
  
  RAISE NOTICE '[TRIGGER_DEBUG] Profundidade do trigger: %', v_trigger_depth;
  
  -- Se já estamos em trigger, não fazer nada
  IF v_trigger_depth > 0 THEN
    RAISE NOTICE '[TRIGGER_DEBUG] Já em trigger (depth > 0), pulando';
    RETURN NEW;
  END IF;
  
  -- Marcar que estamos em trigger
  PERFORM set_config('myapp.trigger_depth', '1', true);
  RAISE NOTICE '[TRIGGER_DEBUG] Flag de recursão setada para 1';
  
  -- CRÍTICO: Verificar se o pedido JÁ TEM vídeo com selected_for_display = true
  SELECT EXISTS(
    SELECT 1 FROM pedido_videos 
    WHERE pedido_id = NEW.pedido_id 
      AND selected_for_display = true 
      AND id != NEW.id
  ) INTO v_has_selected_video;
  
  RAISE NOTICE '[TRIGGER_DEBUG] v_has_selected_video = %', v_has_selected_video;
  
  -- Se não tem vídeo selecionado e este está sendo aprovado, torná-lo base
  IF NOT v_has_selected_video THEN
    RAISE NOTICE '[TRIGGER] ✅ Marcando primeiro vídeo aprovado como base para pedido %', NEW.pedido_id;
    NEW.is_base_video := true;
    NEW.selected_for_display := true;
    NEW.is_active := true;
    RAISE NOTICE '[TRIGGER_DEBUG] Novos valores: is_base_video=%, selected_for_display=%, is_active=%',
      NEW.is_base_video, NEW.selected_for_display, NEW.is_active;
  ELSE
    RAISE NOTICE '[TRIGGER] ℹ️  Pedido % já tem vídeo selecionado, não marcar automaticamente', NEW.pedido_id;
  END IF;
  
  -- Resetar flag
  PERFORM set_config('myapp.trigger_depth', '0', true);
  RAISE NOTICE '[TRIGGER_DEBUG] Flag de recursão resetada para 0';
  RAISE NOTICE '[TRIGGER_DEBUG] ==== FIM TRIGGER ====';
  
  RETURN NEW;
END;
$$;