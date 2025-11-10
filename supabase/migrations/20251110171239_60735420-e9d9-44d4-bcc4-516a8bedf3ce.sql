-- FASE 1: Remover trigger duplicado e simplificar RPC approve_video

-- 1. Remover trigger duplicado pv_auto_select_on_approval_trg
DROP TRIGGER IF EXISTS pv_auto_select_on_approval_trg ON pedido_videos;

-- 2. Recriar função approve_video SIMPLIFICADA (sem lógica de marcar base video - deixar para o trigger)
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
BEGIN
  -- Buscar pedido_id
  SELECT pedido_id INTO v_pedido_id
  FROM pedido_videos 
  WHERE id = p_pedido_video_id;
  
  IF v_pedido_id IS NULL THEN
    RAISE WARNING 'approve_video: Slot % não encontrado', p_pedido_video_id;
    RETURN FALSE;
  END IF;

  -- Verificar se é primeira aprovação
  SELECT NOT EXISTS (
    SELECT 1 FROM pedido_videos 
    WHERE pedido_id = v_pedido_id 
    AND approval_status = 'approved'
    AND id != p_pedido_video_id
  ) INTO v_is_first_approval;

  -- APENAS APROVAR - deixar os triggers cuidarem do resto (selected_for_display, is_base_video)
  UPDATE pedido_videos 
  SET 
    approval_status = 'approved',
    approved_by = p_approved_by,
    approved_at = now(),
    updated_at = now()
  WHERE id = p_pedido_video_id
  AND approval_status = 'pending';
  
  IF NOT FOUND THEN
    RAISE WARNING 'approve_video: Slot % não encontrado ou já aprovado', p_pedido_video_id;
    RETURN FALSE;
  END IF;

  RAISE NOTICE 'approve_video: Vídeo % aprovado com sucesso', p_pedido_video_id;

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
    
    RAISE NOTICE 'approve_video: Datas do contrato atualizadas para pedido %', v_pedido_id;
  END IF;
  
  -- Atualizar status do pedido
  UPDATE pedidos 
  SET 
    status = 'video_aprovado',
    updated_at = now()
  WHERE id = v_pedido_id
  AND status IN ('pago', 'pago_pendente_video', 'video_enviado');
  
  RAISE NOTICE 'approve_video: Status do pedido % atualizado', v_pedido_id;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'approve_video: Erro ao aprovar vídeo %: % - %', p_pedido_video_id, SQLERRM, SQLSTATE;
    RETURN FALSE;
END;
$$;