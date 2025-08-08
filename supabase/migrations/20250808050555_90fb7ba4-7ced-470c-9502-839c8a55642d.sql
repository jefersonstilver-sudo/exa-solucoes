-- Corrigir dados inconsistentes no banco

-- 1. Corrigir is_active no pedido_videos - apenas vídeo base deve estar ativo
UPDATE public.pedido_videos 
SET is_active = false, updated_at = now()
WHERE pedido_id = '5849ff91-bfac-4822-a556-b339db37a0fa'
AND slot_position = 2;

-- 2. Corrigir slot_position no campaign_video_schedules 
UPDATE public.campaign_video_schedules 
SET slot_position = 2, updated_at = now()
WHERE video_id = (
  SELECT video_id FROM public.pedido_videos 
  WHERE pedido_id = '5849ff91-bfac-4822-a556-b339db37a0fa' 
  AND slot_position = 2
)
AND slot_position = 1;