-- Atualizar a função approve_video para ativar automaticamente vídeos aprovados
CREATE OR REPLACE FUNCTION public.approve_video(p_pedido_video_id uuid, p_approved_by uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_pedido_id uuid;
  v_video_id uuid;
  v_other_video RECORD;
  v_is_advanced_campaign boolean := false;
BEGIN
  -- Get the pedido_id and video_id for this video
  SELECT pedido_id, video_id INTO v_pedido_id, v_video_id
  FROM public.pedido_videos 
  WHERE id = p_pedido_video_id;
  
  IF v_pedido_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update the video approval status AND activate it automatically
  UPDATE public.pedido_videos 
  SET 
    approval_status = 'approved',
    approved_by = p_approved_by,
    approved_at = now(),
    is_active = true,  -- CORREÇÃO: Ativar automaticamente quando aprovado
    updated_at = now()
  WHERE id = p_pedido_video_id
  AND approval_status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se este pedido é parte de uma campanha avançada
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns_advanced ca 
    WHERE ca.pedido_id = v_pedido_id
  ) INTO v_is_advanced_campaign;
  
  -- Se não é campanha avançada, usar lógica simples: apenas um vídeo selecionado por pedido
  IF NOT v_is_advanced_campaign THEN
    -- Desmarcar todos os outros vídeos deste pedido
    UPDATE public.pedido_videos 
    SET selected_for_display = false, updated_at = now()
    WHERE pedido_id = v_pedido_id 
    AND id != p_pedido_video_id
    AND selected_for_display = true;
    
    -- Marcar o vídeo aprovado como selecionado
    UPDATE public.pedido_videos 
    SET selected_for_display = true, updated_at = now()
    WHERE id = p_pedido_video_id;
  ELSE
    -- Para campanhas avançadas, verificar conflitos de horário
    -- (lógica mais complexa para campanhas avançadas futuras)
    FOR v_other_video IN
      SELECT pv.id, pv.video_id
      FROM public.pedido_videos pv
      WHERE pv.pedido_id = v_pedido_id
      AND pv.id != p_pedido_video_id
      AND pv.selected_for_display = true
      AND pv.approval_status = 'approved'
    LOOP
      -- Para campanhas avançadas, por enquanto desativar outros vídeos
      -- Isso pode ser expandido no futuro com verificação de conflitos reais
      UPDATE public.pedido_videos 
      SET selected_for_display = false, updated_at = now()
      WHERE id = v_other_video.id;
    END LOOP;
    
    -- Marcar o vídeo aprovado como selecionado
    UPDATE public.pedido_videos 
    SET selected_for_display = true, updated_at = now()
    WHERE id = p_pedido_video_id;
  END IF;
  
  -- Atualizar status do pedido para video_aprovado
  UPDATE public.pedidos 
  SET status = 'video_aprovado'
  WHERE id = v_pedido_id
  AND status IN ('pago', 'pago_pendente_video', 'video_enviado');
  
  RETURN TRUE;
END;
$function$