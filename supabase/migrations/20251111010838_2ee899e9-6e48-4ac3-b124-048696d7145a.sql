-- Garantir que todo pedido tenha pelo menos 1 vídeo selected_for_display=true
-- Esta migration corrige pedidos que ficaram sem vídeo em exibição

DO $$
DECLARE
  pedido_record RECORD;
  base_video_id UUID;
BEGIN
  -- Para cada pedido ativo que não tem vídeo em exibição
  FOR pedido_record IN 
    SELECT DISTINCT p.id as pedido_id
    FROM pedidos p
    WHERE p.status IN ('ativo', 'video_aprovado', 'pago_pendente_video', 'video_enviado', 'pago')
    AND NOT EXISTS (
      SELECT 1 FROM pedido_videos pv
      WHERE pv.pedido_id = p.id
      AND pv.selected_for_display = true
      AND pv.approval_status = 'approved'
    )
  LOOP
    -- Buscar vídeo base aprovado deste pedido
    SELECT pv.video_id INTO base_video_id
    FROM pedido_videos pv
    WHERE pv.pedido_id = pedido_record.pedido_id
    AND pv.is_base_video = true
    AND pv.approval_status = 'approved'
    ORDER BY pv.created_at ASC
    LIMIT 1;
    
    -- Se encontrou vídeo base, marcar como selected_for_display
    IF base_video_id IS NOT NULL THEN
      UPDATE pedido_videos
      SET 
        selected_for_display = true,
        updated_at = now()
      WHERE video_id = base_video_id
      AND pedido_id = pedido_record.pedido_id;
      
      RAISE NOTICE 'Pedido % corrigido: vídeo base % marcado para exibição', pedido_record.pedido_id, base_video_id;
    ELSE
      -- Se não tem vídeo base, pegar o primeiro vídeo aprovado
      SELECT pv.video_id INTO base_video_id
      FROM pedido_videos pv
      WHERE pv.pedido_id = pedido_record.pedido_id
      AND pv.approval_status = 'approved'
      ORDER BY pv.created_at ASC
      LIMIT 1;
      
      IF base_video_id IS NOT NULL THEN
        UPDATE pedido_videos
        SET 
          selected_for_display = true,
          is_base_video = true,
          updated_at = now()
        WHERE video_id = base_video_id
        AND pedido_id = pedido_record.pedido_id;
        
        RAISE NOTICE 'Pedido % corrigido: primeiro vídeo % marcado como base e para exibição', pedido_record.pedido_id, base_video_id;
      END IF;
    END IF;
  END LOOP;
END $$;