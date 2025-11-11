-- Criar RPC para ativar vídeo agendado de forma atômica (sem interferência de triggers)
CREATE OR REPLACE FUNCTION activate_scheduled_video(
  p_video_id uuid,
  p_pedido_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Desabilitar o trigger temporariamente para esta sessão
  SET session_replication_role = 'replica';
  
  -- 1. Desativar todos os vídeos do pedido
  UPDATE pedido_videos
  SET 
    is_active = false,
    selected_for_display = false,
    updated_at = now()
  WHERE pedido_id = p_pedido_id;
  
  -- 2. Ativar apenas o vídeo agendado
  UPDATE pedido_videos
  SET 
    is_active = true,
    selected_for_display = true,
    updated_at = now()
  WHERE video_id = p_video_id
    AND pedido_id = p_pedido_id
    AND approval_status = 'approved';
  
  -- Reabilitar triggers
  SET session_replication_role = 'origin';
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Vídeo agendado ativado com sucesso',
    'video_id', p_video_id,
    'pedido_id', p_pedido_id
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  -- Garantir que os triggers sejam reabilitados mesmo em caso de erro
  SET session_replication_role = 'origin';
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'video_id', p_video_id,
    'pedido_id', p_pedido_id
  );
END;
$$;

COMMENT ON FUNCTION activate_scheduled_video IS 
'Ativa um vídeo agendado de forma atômica, desabilitando temporariamente triggers para evitar race conditions';

-- Permitir execução pública (será chamada pela Edge Function)
GRANT EXECUTE ON FUNCTION activate_scheduled_video(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION activate_scheduled_video(uuid, uuid) TO authenticated;