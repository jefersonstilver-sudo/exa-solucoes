-- 1. CORRIGIR IMEDIATAMENTE O ESTADO DO SLOT 1
UPDATE pedido_videos
SET selected_for_display = true
WHERE id = 'ce3f619c-7b6b-47a8-a7a9-295786950094';

-- 2. CRIAR FUNÇÃO DE CONSISTÊNCIA PARA VÍDEOS BASE
CREATE OR REPLACE FUNCTION ensure_base_video_display_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é vídeo base E está ativo E aprovado → DEVE estar em exibição
  IF NEW.is_base_video = true 
     AND NEW.is_active = true 
     AND NEW.approval_status = 'approved' 
  THEN
    NEW.selected_for_display := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. CRIAR TRIGGER DE CONSISTÊNCIA
DROP TRIGGER IF EXISTS trigger_base_video_display_consistency ON pedido_videos;
CREATE TRIGGER trigger_base_video_display_consistency
BEFORE INSERT OR UPDATE ON pedido_videos
FOR EACH ROW
EXECUTE FUNCTION ensure_base_video_display_status();

-- 4. DROP E RECRIAR RPC safe_set_base_video COM selected_for_display
DROP FUNCTION IF EXISTS safe_set_base_video(uuid);

CREATE FUNCTION safe_set_base_video(p_slot_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pedido_id uuid;
  v_video_id uuid;
  v_affected_rows int;
  v_result jsonb;
BEGIN
  -- Buscar informações do slot
  SELECT pedido_id, video_id INTO v_pedido_id, v_video_id
  FROM pedido_videos
  WHERE id = p_slot_id;

  IF v_pedido_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Slot não encontrado'
    );
  END IF;

  IF v_video_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Slot não possui vídeo associado'
    );
  END IF;

  -- Desativar vídeo base anterior do mesmo pedido
  UPDATE pedido_videos
  SET is_base_video = false
  WHERE pedido_id = v_pedido_id
    AND is_base_video = true
    AND id != p_slot_id;

  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;

  -- Ativar novo vídeo base e garantir que está em exibição
  UPDATE pedido_videos
  SET 
    is_base_video = true,
    is_active = true,
    selected_for_display = true
  WHERE id = p_slot_id;

  -- Validação final de consistência
  IF NOT EXISTS (
    SELECT 1 FROM pedido_videos 
    WHERE id = p_slot_id 
      AND is_base_video = true 
      AND is_active = true 
      AND selected_for_display = true
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Falha ao garantir consistência do vídeo base'
    );
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Vídeo base definido com sucesso',
    'slot_id', p_slot_id,
    'pedido_id', v_pedido_id,
    'video_id', v_video_id,
    'previous_base_deactivated', v_affected_rows
  );

  RETURN v_result;
END;
$$;