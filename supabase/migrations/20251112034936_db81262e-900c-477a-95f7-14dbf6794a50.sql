
-- Corrigir dados inconsistentes no pedido específico
-- Vídeo base DEVE ter selected_for_display = true

DO $$
BEGIN
  RAISE NOTICE '🔧 Corrigindo vídeo base com dados inconsistentes...';
  
  UPDATE pedido_videos
  SET 
    selected_for_display = true,
    is_active = true,
    updated_at = now()
  WHERE pedido_id = 'c0214207-dae2-494e-89e4-36aa6a97ee4f'
  AND is_base_video = true
  AND selected_for_display = false;
  
  RAISE NOTICE '✅ Dados corrigidos para o pedido';
END $$;
