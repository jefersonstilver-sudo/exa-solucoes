-- ETAPA 1: Modificar a RPC set_base_video_enhanced
CREATE OR REPLACE FUNCTION public.set_base_video_enhanced(p_pedido_video_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pedido_id uuid;
  v_video_id uuid;
  v_video_nome text;
  v_approval_status text;
  v_result jsonb;
BEGIN
  -- Obter informações do vídeo
  SELECT 
    pedido_id,
    video_id,
    approval_status
  INTO 
    v_pedido_id,
    v_video_id,
    v_approval_status
  FROM public.pedido_videos
  WHERE id = p_pedido_video_id;
  
  -- Verificar se o vídeo existe
  IF v_pedido_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Video not found'
    );
  END IF;
  
  -- Verificar se o vídeo está aprovado
  IF v_approval_status != 'approved' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Video must be approved first'
    );
  END IF;
  
  -- Obter nome do vídeo
  SELECT nome INTO v_video_nome
  FROM public.videos
  WHERE id = v_video_id;
  
  -- CORREÇÃO: Desmarcar APENAS o vídeo base anterior (não todos os vídeos)
  UPDATE public.pedido_videos
  SET is_base_video = false,
      updated_at = now()
  WHERE pedido_id = v_pedido_id
    AND is_base_video = true
    AND id != p_pedido_video_id;
  
  -- Desativar vídeos que NÃO são base e NÃO têm conflito de agendamento
  UPDATE public.pedido_videos
  SET selected_for_display = false,
      is_active = false,
      updated_at = now()
  WHERE pedido_id = v_pedido_id
    AND id != p_pedido_video_id
    AND is_base_video = false;
  
  -- Ativar e definir o novo vídeo como base
  UPDATE public.pedido_videos
  SET 
    is_active = true,
    selected_for_display = true,
    is_base_video = true,
    updated_at = now()
  WHERE id = p_pedido_video_id;
  
  -- Log da ação
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'VIDEO_BASE_CHANGED',
    format('Video base changed for pedido %s to video %s (%s)', 
           v_pedido_id, v_video_id, v_video_nome)
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'message', format('Video %s set as base successfully', v_video_nome),
    'video_name', v_video_nome
  );
  
  RETURN v_result;
END;
$function$;

-- ETAPA 2: Garantir que Slot 1 tem is_base_video = true
UPDATE pedido_videos
SET is_base_video = true,
    updated_at = now()
WHERE pedido_id = 'c0214207-dae2-494e-89e4-36aa6a97ee4f'
  AND slot_position = 1;

-- ETAPA 3: Criar proteção para a flag is_base_video
CREATE OR REPLACE FUNCTION public.protect_base_video_flag()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_has_other_base boolean;
  v_has_other_approved boolean;
BEGIN
  -- Verificar se está tentando remover is_base_video
  IF OLD.is_base_video = true AND NEW.is_base_video = false THEN
    
    -- Verificar se há outro vídeo base sendo definido na mesma transação
    SELECT EXISTS (
      SELECT 1 FROM pedido_videos
      WHERE pedido_id = NEW.pedido_id
        AND is_base_video = true
        AND id != OLD.id
    ) INTO v_has_other_base;
    
    -- Se já há outro vídeo base, permitir a remoção
    IF v_has_other_base THEN
      RETURN NEW;
    END IF;
    
    -- Verificar se há outros vídeos aprovados
    SELECT EXISTS (
      SELECT 1 FROM pedido_videos
      WHERE pedido_id = NEW.pedido_id
        AND approval_status = 'approved'
        AND video_id != NEW.video_id
    ) INTO v_has_other_approved;
    
    -- Se não há outros vídeos aprovados, manter is_base_video
    IF NOT v_has_other_approved THEN
      RAISE NOTICE 'Mantendo is_base_video=true para vídeo % pois é o único aprovado', OLD.id;
      NEW.is_base_video := true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar trigger para proteger is_base_video
DROP TRIGGER IF EXISTS trigger_protect_base_video_flag ON public.pedido_videos;
CREATE TRIGGER trigger_protect_base_video_flag
  BEFORE UPDATE ON public.pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_base_video_flag();