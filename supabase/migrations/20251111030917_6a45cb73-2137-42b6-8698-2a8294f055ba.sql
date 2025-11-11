-- Recriar RPC usando UPDATE atômico com CASE WHEN
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
  -- Fazer tudo em UMA ÚNICA QUERY UPDATE usando CASE WHEN
  -- Isso é atômico e evita a constraint
  UPDATE pedido_videos
  SET 
    is_active = CASE 
      WHEN video_id = p_video_id THEN true
      ELSE false
    END,
    selected_for_display = CASE 
      WHEN video_id = p_video_id THEN true
      ELSE false
    END,
    updated_at = now()
  WHERE pedido_id = p_pedido_id
    AND (video_id = p_video_id OR is_active = true OR selected_for_display = true);
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  
  -- Verificar se o vídeo foi ativado
  IF NOT EXISTS (
    SELECT 1 FROM pedido_videos
    WHERE video_id = p_video_id
      AND pedido_id = p_pedido_id
      AND is_active = true
      AND selected_for_display = true
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Vídeo não foi ativado - verifique se está aprovado',
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
    'video_id', p_video_id,
    'pedido_id', p_pedido_id
  );
END;
$$;

COMMENT ON FUNCTION activate_scheduled_video IS 
'Ativa um vídeo agendado de forma atômica usando CASE WHEN em uma única query UPDATE';

-- Permitir execução pública
GRANT EXECUTE ON FUNCTION activate_scheduled_video(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION activate_scheduled_video(uuid, uuid) TO authenticated;