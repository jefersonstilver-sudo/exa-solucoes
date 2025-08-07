-- Atualizar função approve_video para promover pedido para video_aprovado
CREATE OR REPLACE FUNCTION public.approve_video(p_pedido_video_id uuid, p_approved_by uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_pedido_id uuid;
BEGIN
  -- Get the pedido_id for this video
  SELECT pedido_id INTO v_pedido_id
  FROM public.pedido_videos 
  WHERE id = p_pedido_video_id;
  
  IF v_pedido_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update the video approval status
  UPDATE public.pedido_videos 
  SET 
    approval_status = 'approved',
    approved_by = p_approved_by,
    approved_at = now(),
    updated_at = now()
  WHERE id = p_pedido_video_id
  AND approval_status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Automatically set this video as selected for display
  -- First, unselect all other videos for this pedido
  UPDATE public.pedido_videos 
  SET selected_for_display = false, updated_at = now()
  WHERE pedido_id = v_pedido_id
  AND id != p_pedido_video_id;
  
  -- Then select the approved video for display
  UPDATE public.pedido_videos 
  SET selected_for_display = true, updated_at = now()
  WHERE id = p_pedido_video_id;
  
  -- NOVO: Atualizar status do pedido para video_aprovado
  UPDATE public.pedidos 
  SET status = 'video_aprovado'
  WHERE id = v_pedido_id
  AND status IN ('pago', 'pago_pendente_video', 'video_enviado');
  
  RETURN TRUE;
END;
$function$;

-- Corrigir dados existentes: atualizar pedidos que já têm vídeos aprovados e em exibição
UPDATE public.pedidos 
SET status = 'video_aprovado'
WHERE id IN (
  SELECT DISTINCT pv.pedido_id
  FROM public.pedido_videos pv
  WHERE pv.approval_status = 'approved'
  AND pv.selected_for_display = true
)
AND status IN ('pago', 'pago_pendente_video', 'video_enviado');

-- Log da correção
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'CAMPANHAS_ATIVAS_FIX',
  'Corrigidos status de pedidos com vídeos aprovados para video_aprovado'
);