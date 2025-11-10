-- Criar função RPC para validar se um vídeo pode ser removido
-- Regra: Não permitir remover o último vídeo aprovado de um pedido ativo

CREATE OR REPLACE FUNCTION can_remove_video(p_pedido_video_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pedido_id UUID;
  v_pedido_status TEXT;
  v_approved_count INTEGER;
BEGIN
  -- Buscar pedido_id e status
  SELECT pedido_id INTO v_pedido_id
  FROM pedido_videos
  WHERE id = p_pedido_video_id;

  IF v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Vídeo não encontrado';
  END IF;

  -- Buscar status do pedido
  SELECT status INTO v_pedido_status
  FROM pedidos
  WHERE id = v_pedido_id;

  -- Se pedido não está ativo, pode remover
  IF v_pedido_status != 'video_aprovado' THEN
    RETURN TRUE;
  END IF;

  -- Contar quantos vídeos aprovados existem no pedido (excluindo o que será removido)
  SELECT COUNT(*)
  INTO v_approved_count
  FROM pedido_videos
  WHERE pedido_id = v_pedido_id
    AND approval_status = 'approved'
    AND id != p_pedido_video_id;

  -- Se restar pelo menos 1 vídeo aprovado, pode remover
  IF v_approved_count >= 1 THEN
    RETURN TRUE;
  END IF;

  -- Caso contrário, não pode remover (seria o último vídeo aprovado)
  RETURN FALSE;
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION can_remove_video(UUID) IS 
'Valida se um vídeo pode ser removido. Retorna FALSE se for o último vídeo aprovado de um pedido ativo.';