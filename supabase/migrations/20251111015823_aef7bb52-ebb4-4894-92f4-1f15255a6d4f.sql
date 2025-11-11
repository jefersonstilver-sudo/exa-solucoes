
-- Corrigir o vídeo base que perdeu a marcação
UPDATE pedido_videos
SET is_base_video = true
WHERE pedido_id = 'c0214207-dae2-494e-89e4-36aa6a97ee4f'
  AND slot_position = 1
  AND video_id = '3c130bfa-19ff-4773-a0f4-29f9ad73fd9e';
