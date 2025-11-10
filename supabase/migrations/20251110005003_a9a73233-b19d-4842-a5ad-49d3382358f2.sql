-- Remover qualquer trigger que tente atualizar updated_at em pedidos
DROP TRIGGER IF EXISTS update_pedidos_updated_at ON public.pedidos;

-- Recriar função approve_video sem referências a updated_at da tabela pedidos
CREATE OR REPLACE FUNCTION public.approve_video(p_pedido_video_id uuid, p_approved_by uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido_id uuid;
  v_video_id uuid;
  v_is_first_approval boolean := false;
  v_plano_meses integer;
  v_existing_base boolean := false;
BEGIN
  -- Get the pedido_id and video_id for this video
  SELECT pedido_id, video_id INTO v_pedido_id, v_video_id
  FROM pedido_videos 
  WHERE id = p_pedido_video_id;
  
  IF v_pedido_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verificar se é a primeira aprovação deste pedido
  SELECT NOT EXISTS (
    SELECT 1 FROM pedido_videos 
    WHERE pedido_id = v_pedido_id 
    AND approval_status = 'approved'
    AND id != p_pedido_video_id
  ) INTO v_is_first_approval;
  
  -- Verificar se já existe um vídeo base
  SELECT EXISTS (
    SELECT 1 FROM pedido_videos 
    WHERE pedido_id = v_pedido_id 
    AND is_base_video = true
    AND approval_status = 'approved'
    AND id != p_pedido_video_id
  ) INTO v_existing_base;
  
  -- LÓGICA PRINCIPAL: Determinar se será vídeo base
  -- É base se: é primeiro aprovado OU não há vídeo base existente
  DECLARE
    v_will_be_base boolean := v_is_first_approval OR NOT v_existing_base;
  BEGIN
    -- Update the video approval status
    UPDATE pedido_videos 
    SET 
      approval_status = 'approved',
      approved_by = p_approved_by,
      approved_at = now(),
      is_active = true,
      is_base_video = v_will_be_base,
      selected_for_display = v_will_be_base,
      updated_at = now()
    WHERE id = p_pedido_video_id
    AND approval_status = 'pending';
    
    IF NOT FOUND THEN
      RETURN FALSE;
    END IF;

    -- Se este vídeo foi definido como base, desmarcar outros
    IF v_will_be_base THEN
      UPDATE pedido_videos 
      SET 
        is_base_video = false, 
        selected_for_display = false,
        updated_at = now()
      WHERE pedido_id = v_pedido_id 
      AND id != p_pedido_video_id;
    END IF;
  END;

  -- Se é a primeira aprovação, atualizar as datas do contrato
  IF v_is_first_approval THEN
    -- Buscar plano do pedido
    SELECT plano_meses INTO v_plano_meses
    FROM pedidos 
    WHERE id = v_pedido_id;
    
    -- Atualizar datas do contrato: começa hoje
    -- CORRIGIDO: Removida referência a updated_at que não existe em pedidos
    UPDATE pedidos 
    SET 
      data_inicio = CURRENT_DATE,
      data_fim = CURRENT_DATE + (v_plano_meses || ' months')::interval
    WHERE id = v_pedido_id;
    
    -- Log da atualização de datas
    INSERT INTO log_eventos_sistema (
      tipo_evento,
      descricao
    ) VALUES (
      'CONTRACT_ACTIVATION',
      format('Contrato ativado para pedido %s: início=%s, fim=%s. Primeiro vídeo aprovado: %s', 
             v_pedido_id, CURRENT_DATE, CURRENT_DATE + (v_plano_meses || ' months')::interval, p_pedido_video_id)
    );
  END IF;
  
  -- Atualizar status do pedido para video_aprovado
  -- CORRIGIDO: Removida qualquer referência implícita a updated_at
  UPDATE pedidos 
  SET status = 'video_aprovado'
  WHERE id = v_pedido_id
  AND status IN ('pago', 'pago_pendente_video', 'video_enviado');
  
  RETURN TRUE;
END;
$function$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.approve_video(uuid, uuid) TO authenticated;

-- Log migration
INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
VALUES ('MIGRATION', 'Corrigida função approve_video removendo referências a coluna updated_at inexistente na tabela pedidos');