-- Corrigir pedidos com status inconsistente
-- Atualizar pedidos que estão "pago" mas já têm vídeos aprovados para "video_aprovado"
UPDATE public.pedidos 
SET status = 'video_aprovado'
WHERE status = 'pago' 
AND id IN (
  SELECT DISTINCT p.id 
  FROM public.pedidos p
  JOIN public.pedido_videos pv ON pv.pedido_id = p.id
  WHERE p.status = 'pago'
  AND pv.approval_status = 'approved'
);

-- Criar trigger para manter sincronização automática
-- Quando um vídeo é aprovado, atualizar o status do pedido automaticamente
CREATE OR REPLACE FUNCTION auto_update_pedido_status_on_video_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o vídeo foi aprovado e o pedido ainda está como 'pago' ou 'pago_pendente_video'
  IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
    UPDATE public.pedidos 
    SET status = 'video_aprovado'
    WHERE id = NEW.pedido_id 
    AND status IN ('pago', 'pago_pendente_video');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar o trigger na tabela pedido_videos
DROP TRIGGER IF EXISTS trigger_auto_update_pedido_status ON public.pedido_videos;
CREATE TRIGGER trigger_auto_update_pedido_status
  AFTER UPDATE ON public.pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_pedido_status_on_video_approval();