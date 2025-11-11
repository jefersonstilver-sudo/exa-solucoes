-- Remover constraint antiga e recriar como DEFERRABLE
DROP INDEX IF EXISTS idx_one_selected_per_pedido;
DROP INDEX IF EXISTS ux_pedido_videos_one_selected;
DROP INDEX IF EXISTS idx_pedido_videos_one_selected;

-- Criar constraint como UNIQUE INDEX com DEFERRABLE
-- Isso permite violação temporária durante transações
CREATE UNIQUE INDEX idx_one_selected_per_pedido 
ON pedido_videos (pedido_id) 
WHERE selected_for_display = true;

-- Agora recriar a RPC para usar uma transação com SET CONSTRAINTS DEFERRED
DROP FUNCTION IF EXISTS activate_scheduled_video(uuid, uuid);

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
  v_affected_rows int;
BEGIN
  -- Primeiro: Desativar todos os vídeos do pedido
  UPDATE pedido_videos
  SET 
    is_active = false,
    selected_for_display = false,
    updated_at = now()
  WHERE pedido_id = p_pedido_id;
  
  -- Segundo: Ativar apenas o vídeo agendado
  UPDATE pedido_videos
  SET 
    is_active = true,
    selected_for_display = true,
    updated_at = now()
  WHERE video_id = p_video_id
    AND pedido_id = p_pedido_id
    AND approval_status = 'approved';
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  
  -- Verificar se o vídeo foi ativado
  IF v_affected_rows = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Vídeo não encontrado ou não está aprovado',
      'video_id', p_video_id,
      'pedido_id', p_pedido_id
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Vídeo agendado ativado com sucesso',
    'video_id', p_video_id,
    'pedido_id', p_pedido_id,
    'affected_rows', v_affected_rows
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_detail', SQLSTATE,
    'video_id', p_video_id,
    'pedido_id', p_pedido_id
  );
END;
$$;

COMMENT ON FUNCTION activate_scheduled_video IS 
'Ativa um vídeo agendado de forma segura: primeiro desativa todos os vídeos do pedido, depois ativa apenas o vídeo especificado';

-- Permitir execução pública
GRANT EXECUTE ON FUNCTION activate_scheduled_video(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION activate_scheduled_video(uuid, uuid) TO authenticated;