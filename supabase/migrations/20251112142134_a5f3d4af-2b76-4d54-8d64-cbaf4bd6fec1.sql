-- Corrigir protect_last_base_video para respeitar flag app.in_rpc_context
-- A função estava bloqueando operações mesmo quando chamada via RPC

CREATE OR REPLACE FUNCTION protect_last_base_video()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_count INTEGER;
  approved_count INTEGER;
  next_base_id UUID;
BEGIN
  -- ⭐ CRITICAL: Bypassar validação se estiver em contexto RPC
  IF current_setting('app.in_rpc_context', true) = 'true' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- UPDATE: Tentando desmarcar is_base_video
  IF (TG_OP = 'UPDATE' AND OLD.is_base_video = true AND NEW.is_base_video = false) THEN
    SELECT COUNT(*) INTO base_count
    FROM public.pedido_videos
    WHERE pedido_id = OLD.pedido_id
    AND is_base_video = true
    AND id != OLD.id;
    
    IF base_count = 0 THEN
      RAISE EXCEPTION 'CANNOT_REMOVE_LAST_BASE_VIDEO: Não é possível desmarcar o único vídeo base. Defina outro vídeo como base primeiro.';
    END IF;
  END IF;
  
  -- DELETE: Tentando deletar vídeo base
  IF (TG_OP = 'DELETE' AND OLD.is_base_video = true) THEN
    SELECT COUNT(*) INTO approved_count
    FROM public.pedido_videos
    WHERE pedido_id = OLD.pedido_id
    AND approval_status = 'approved'
    AND id != OLD.id;
    
    IF approved_count = 0 THEN
      RAISE EXCEPTION 'CANNOT_DELETE_LAST_BASE_VIDEO: Não é possível remover o único vídeo aprovado. Envie outro vídeo primeiro.';
    END IF;
    
    SELECT id INTO next_base_id
    FROM public.pedido_videos
    WHERE pedido_id = OLD.pedido_id
    AND approval_status = 'approved'
    AND id != OLD.id
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF next_base_id IS NOT NULL THEN
      UPDATE public.pedido_videos
      SET 
        is_base_video = true,
        is_active = true,
        selected_for_display = true,
        updated_at = now()
      WHERE id = next_base_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION protect_last_base_video IS 'Protege contra remoção do último vídeo base, mas permite bypass via flag app.in_rpc_context quando chamado por RPCs';