
-- ========================================
-- CORREÇÃO: Usar nomes corretos dos triggers
-- ========================================

-- 1. Desabilitar triggers
ALTER TABLE pedido_videos DISABLE TRIGGER protect_last_base_video_trigger;
ALTER TABLE pedido_videos DISABLE TRIGGER trigger_enforce_single_active_video;

-- 2. Corrigir dados
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '🔧 [FIX] Corrigindo vídeos base...';
  
  UPDATE pedido_videos
  SET 
    selected_for_display = true,
    is_active = true,
    updated_at = now()
  WHERE is_base_video = true
  AND (selected_for_display = false OR is_active = false);
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✅ [FIX] % vídeos base corrigidos', v_count;
END $$;

-- 3. Reabilitar triggers
ALTER TABLE pedido_videos ENABLE TRIGGER protect_last_base_video_trigger;
ALTER TABLE pedido_videos ENABLE TRIGGER trigger_enforce_single_active_video;
