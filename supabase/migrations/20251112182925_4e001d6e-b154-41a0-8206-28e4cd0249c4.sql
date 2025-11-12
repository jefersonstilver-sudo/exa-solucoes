-- Atualizar pedidos com vídeos aprovados para status 'ativo'
UPDATE pedidos
SET status = 'ativo', updated_at = now()
WHERE status = 'pago' 
AND EXISTS (
  SELECT 1 FROM pedido_videos 
  WHERE pedido_videos.pedido_id = pedidos.id 
  AND pedido_videos.approval_status = 'approved'
);