
-- Corrigir manualmente forçando todas as flags
UPDATE pedido_videos
SET 
  is_base_video = true,
  is_active = false,
  selected_for_display = false,
  updated_at = now()
WHERE pedido_id = 'c0214207-dae2-494e-89e4-36aa6a97ee4f'
  AND slot_position = 1;
