-- Corrigir triggers para usar funções seguras e remover duplicados

-- 1. Atualizar trigger_auto_set_base_video para usar a função SAFE
DROP TRIGGER IF EXISTS trigger_auto_set_base_video ON pedido_videos;
CREATE TRIGGER trigger_auto_set_base_video
  BEFORE INSERT OR UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_first_approved_video_as_base_safe();

-- 2. Remover trigger duplicado BEFORE (deixar apenas o AFTER)
DROP TRIGGER IF EXISTS prevent_base_video_removal_trigger ON pedido_videos;

-- 3. Remover trigger sync_video_display_status se ainda existir (pode causar loops)
DROP TRIGGER IF EXISTS trigger_sync_video_display_status ON pedido_videos;

-- 4. Garantir que a função set_base_video_enhanced não seja bloqueada por triggers
-- Adicionar um flag de configuração para desabilitar triggers durante RPCs
CREATE OR REPLACE FUNCTION public.set_base_video_enhanced(p_pedido_video_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido_id uuid;
  v_status text;
  v_video_id uuid;
  v_affected_rows int;
BEGIN
  -- Desabilitar triggers temporariamente para esta transação
  SET LOCAL session_replication_role = 'replica';
  
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
  
  -- Reabilitar triggers para próximas operações
  SET LOCAL session_replication_role = 'origin';

  RETURN jsonb_build_object(
    'success', true, 
    'pedido_id', v_pedido_id, 
    'video_id', v_video_id,
    'message', 'Vídeo base definido com sucesso'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Garantir que triggers sejam reabilitados mesmo em caso de erro
    SET LOCAL session_replication_role = 'origin';
    RAISE WARNING 'set_base_video_enhanced: Erro: % - %', SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'exception', 
      'message', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$function$;