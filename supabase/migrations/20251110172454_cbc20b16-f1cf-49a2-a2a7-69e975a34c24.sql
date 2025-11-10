-- Melhorar logging da função approve_video para diagnosticar por que retorna FALSE

CREATE OR REPLACE FUNCTION approve_video(p_pedido_video_id uuid, p_approved_by uuid)
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pedido_id uuid;
  v_is_first_approval boolean;
  v_plano_meses integer;
  v_update_count integer;
BEGIN
  RAISE NOTICE '[APPROVE_VIDEO] Iniciando aprovação do vídeo %', p_pedido_video_id;
  
  -- Buscar pedido_id
  SELECT pedido_id INTO v_pedido_id
  FROM pedido_videos 
  WHERE id = p_pedido_video_id;
  
  IF v_pedido_id IS NULL THEN
    RAISE WARNING '[APPROVE_VIDEO] ERRO: Slot % não encontrado', p_pedido_video_id;
    RETURN FALSE;
  END IF;
  
  RAISE NOTICE '[APPROVE_VIDEO] Pedido encontrado: %', v_pedido_id;

  -- Verificar se é primeira aprovação
  SELECT NOT EXISTS (
    SELECT 1 FROM pedido_videos 
    WHERE pedido_id = v_pedido_id 
    AND approval_status = 'approved'
    AND id != p_pedido_video_id
  ) INTO v_is_first_approval;
  
  RAISE NOTICE '[APPROVE_VIDEO] É primeira aprovação? %', v_is_first_approval;

  -- APENAS APROVAR - deixar os triggers cuidarem do resto
  RAISE NOTICE '[APPROVE_VIDEO] Executando UPDATE para aprovar vídeo...';
  
  UPDATE pedido_videos 
  SET 
    approval_status = 'approved',
    approved_by = p_approved_by,
    approved_at = now(),
    updated_at = now()
  WHERE id = p_pedido_video_id
  AND approval_status = 'pending';
  
  GET DIAGNOSTICS v_update_count = ROW_COUNT;
  
  RAISE NOTICE '[APPROVE_VIDEO] Linhas atualizadas: %', v_update_count;
  
  IF v_update_count = 0 THEN
    RAISE WARNING '[APPROVE_VIDEO] ERRO: Nenhuma linha foi atualizada. Slot % não encontrado ou já aprovado', p_pedido_video_id;
    RETURN FALSE;
  END IF;

  RAISE NOTICE '[APPROVE_VIDEO] Vídeo % aprovado com sucesso', p_pedido_video_id;

  -- Se primeira aprovação, atualizar datas do contrato
  IF v_is_first_approval THEN
    SELECT plano_meses INTO v_plano_meses
    FROM pedidos 
    WHERE id = v_pedido_id;
    
    UPDATE pedidos 
    SET 
      data_inicio = CURRENT_DATE,
      data_fim = CURRENT_DATE + (v_plano_meses || ' months')::interval,
      updated_at = now()
    WHERE id = v_pedido_id;
    
    RAISE NOTICE '[APPROVE_VIDEO] Datas do contrato atualizadas para pedido %', v_pedido_id;
  END IF;
  
  -- Atualizar status do pedido
  UPDATE pedidos 
  SET 
    status = 'video_aprovado',
    updated_at = now()
  WHERE id = v_pedido_id
  AND status IN ('pago', 'pago_pendente_video', 'video_enviado');
  
  RAISE NOTICE '[APPROVE_VIDEO] Status do pedido % atualizado', v_pedido_id;
  RAISE NOTICE '[APPROVE_VIDEO] Aprovação concluída com sucesso!';
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[APPROVE_VIDEO] EXCEPTION: Erro ao aprovar vídeo %: % - %', p_pedido_video_id, SQLERRM, SQLSTATE;
    RETURN FALSE;
END;
$$;