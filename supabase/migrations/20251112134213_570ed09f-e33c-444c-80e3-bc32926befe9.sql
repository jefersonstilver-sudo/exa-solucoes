
-- ========================================================================
-- CORREÇÃO CRÍTICA: Adicionar schema public. em TODAS funções que usam pedido_videos
-- Erro: "relation pedido_videos does not exist" causado por search_path = ''
-- ========================================================================

-- 1) reactivate_base_video_when_no_schedules
CREATE OR REPLACE FUNCTION reactivate_base_video_when_no_schedules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id uuid;
  v_base_video_id uuid;
  v_active_schedules_count int;
BEGIN
  SELECT cvs.pedido_id INTO v_pedido_id
  FROM public.campaign_video_schedules cvs
  WHERE cvs.id = OLD.campaign_video_schedule_id;

  IF v_pedido_id IS NULL THEN
    RETURN OLD;
  END IF;

  SELECT COUNT(*) INTO v_active_schedules_count
  FROM public.campaign_schedule_rules csr
  JOIN public.campaign_video_schedules cvs ON cvs.id = csr.campaign_video_schedule_id
  WHERE cvs.pedido_id = v_pedido_id
    AND csr.is_active = true;

  IF v_active_schedules_count = 0 THEN
    SELECT id INTO v_base_video_id
    FROM public.pedido_videos
    WHERE pedido_id = v_pedido_id
      AND is_base_video = true
    LIMIT 1;

    IF v_base_video_id IS NOT NULL THEN
      PERFORM set_config('app.in_rpc_context', 'true', true);
      
      UPDATE public.pedido_videos
      SET 
        is_active = true,
        selected_for_display = true,
        updated_at = NOW()
      WHERE id = v_base_video_id;
      
      PERFORM set_config('app.in_rpc_context', 'false', true);
    END IF;
  END IF;

  RETURN OLD;
END;
$$;

-- 2) validate_base_video_rules
CREATE OR REPLACE FUNCTION validate_base_video_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining_approved_videos integer;
  v_is_base_video boolean;
BEGIN
  IF current_setting('app.in_rpc_context', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.is_base_video = true THEN
    NEW.selected_for_display := true;
    NEW.is_active := true;
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.is_base_video = true AND NEW.is_base_video = false THEN
    SELECT COUNT(*) INTO v_remaining_approved_videos
    FROM public.pedido_videos
    WHERE pedido_id = OLD.pedido_id
    AND approval_status = 'approved'
    AND id != OLD.id;
    
    IF v_remaining_approved_videos = 0 THEN
      RAISE EXCEPTION 'Não é possível remover o último vídeo principal. Defina outro vídeo como principal primeiro.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3) protect_last_base_video
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
