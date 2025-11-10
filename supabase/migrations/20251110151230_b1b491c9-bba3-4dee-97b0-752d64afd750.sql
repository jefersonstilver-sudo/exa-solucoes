-- Corrigir estado inconsistente: garantir apenas um vídeo selecionado por pedido
-- Manter apenas o vídeo base como selecionado

DO $$
DECLARE
  v_pedido uuid;
  v_base_video uuid;
BEGIN
  -- Para cada pedido com múltiplos vídeos selecionados
  FOR v_pedido IN 
    SELECT pedido_id 
    FROM pedido_videos 
    WHERE selected_for_display = true 
    GROUP BY pedido_id 
    HAVING COUNT(*) > 1
  LOOP
    -- Encontrar o vídeo base deste pedido
    SELECT id INTO v_base_video
    FROM pedido_videos
    WHERE pedido_id = v_pedido
      AND is_base_video = true
      AND approval_status = 'approved'
    LIMIT 1;
    
    -- Se não encontrou vídeo base, pegar o primeiro aprovado
    IF v_base_video IS NULL THEN
      SELECT id INTO v_base_video
      FROM pedido_videos
      WHERE pedido_id = v_pedido
        AND approval_status = 'approved'
      ORDER BY slot_position
      LIMIT 1;
    END IF;
    
    -- Desmarcar todos os outros vídeos deste pedido
    UPDATE pedido_videos
    SET selected_for_display = false,
        is_active = false,
        updated_at = now()
    WHERE pedido_id = v_pedido
      AND id != v_base_video;
      
    -- Garantir que o vídeo base está marcado corretamente
    UPDATE pedido_videos
    SET selected_for_display = true,
        is_base_video = true,
        is_active = true,
        updated_at = now()
    WHERE id = v_base_video;
    
    RAISE NOTICE 'Corrigido pedido %: vídeo base %', v_pedido, v_base_video;
  END LOOP;
END $$;

-- Recriar a função set_base_video_enhanced com melhor tratamento de erros
CREATE OR REPLACE FUNCTION public.set_base_video_enhanced(p_pedido_video_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pedido_id uuid;
  v_status text;
  v_video_id uuid;
  v_affected_rows int;
BEGIN
  -- Log de início
  RAISE NOTICE 'set_base_video_enhanced: Iniciando para slot %', p_pedido_video_id;
  
  -- Validar slot e status aprovado + lock da linha alvo
  SELECT pedido_id, approval_status, video_id
  INTO v_pedido_id, v_status, v_video_id
  FROM public.pedido_videos
  WHERE id = p_pedido_video_id
  FOR UPDATE;

  IF v_pedido_id IS NULL THEN
    RAISE WARNING 'set_base_video_enhanced: Slot % não encontrado', p_pedido_video_id;
    RETURN jsonb_build_object('success', false, 'error', 'slot_not_found');
  END IF;
  
  IF v_status <> 'approved' THEN
    RAISE WARNING 'set_base_video_enhanced: Slot % não aprovado (status: %)', p_pedido_video_id, v_status;
    RETURN jsonb_build_object('success', false, 'error', 'not_approved', 'status', v_status);
  END IF;

  RAISE NOTICE 'set_base_video_enhanced: Slot válido. Pedido: %, Vídeo: %', v_pedido_id, v_video_id;

  -- Lock de todas as linhas do mesmo pedido para evitar corridas
  PERFORM 1 FROM public.pedido_videos WHERE pedido_id = v_pedido_id FOR UPDATE;

  -- Desmarcar/Desativar outros vídeos desse pedido
  UPDATE public.pedido_videos
  SET selected_for_display = false,
      is_base_video = false,
      is_active = false,
      updated_at = now()
  WHERE pedido_id = v_pedido_id
    AND id <> p_pedido_video_id;
    
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RAISE NOTICE 'set_base_video_enhanced: % vídeos desmarcados', v_affected_rows;

  -- Marcar o novo vídeo como base, selecionado e ativo
  UPDATE public.pedido_videos
  SET selected_for_display = true,
      is_base_video = true,
      is_active = true,
      updated_at = now()
  WHERE id = p_pedido_video_id;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  
  IF v_affected_rows = 0 THEN
    RAISE WARNING 'set_base_video_enhanced: Falha ao marcar slot % como base', p_pedido_video_id;
    RETURN jsonb_build_object('success', false, 'error', 'update_failed');
  END IF;
  
  RAISE NOTICE 'set_base_video_enhanced: Slot % marcado como base com sucesso', p_pedido_video_id;

  RETURN jsonb_build_object(
    'success', true, 
    'pedido_id', v_pedido_id, 
    'video_id', v_video_id,
    'message', 'Vídeo base definido com sucesso'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'set_base_video_enhanced: Erro: % - %', SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'exception', 
      'message', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$;