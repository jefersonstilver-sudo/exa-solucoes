-- 1) Ajustar a constraint de slot_position de 1..4 para 1..10
ALTER TABLE public.pedido_videos
  DROP CONSTRAINT IF EXISTS pedido_videos_slot_position_check;

ALTER TABLE public.pedido_videos
  ADD CONSTRAINT pedido_videos_slot_position_check
  CHECK (slot_position >= 1 AND slot_position <= 10);

-- 2) Atualizar produto Horizontal para o limite real de 10 vídeos por pedido
UPDATE public.produtos_exa
SET max_videos_por_pedido = 10
WHERE codigo = 'horizontal';