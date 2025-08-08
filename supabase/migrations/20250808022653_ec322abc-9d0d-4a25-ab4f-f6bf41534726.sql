-- Implementar sistema de vídeo base e funcionalidades de agendamento individual

-- 1. Adicionar campo is_base_video na tabela pedido_videos
ALTER TABLE public.pedido_videos 
ADD COLUMN is_base_video boolean NOT NULL DEFAULT false;

-- 2. Criar função para definir vídeo base
CREATE OR REPLACE FUNCTION public.set_base_video(p_pedido_video_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_pedido_id uuid;
  v_approval_status text;
BEGIN
  -- Verificar se o vídeo existe e está aprovado
  SELECT pedido_id, approval_status 
  INTO v_pedido_id, v_approval_status
  FROM public.pedido_videos 
  WHERE id = p_pedido_video_id;
  
  IF v_pedido_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Só vídeos aprovados podem ser base
  IF v_approval_status != 'approved' THEN
    RETURN FALSE;
  END IF;
  
  -- Desmarcar outros vídeos base do mesmo pedido
  UPDATE public.pedido_videos 
  SET is_base_video = false, updated_at = now()
  WHERE pedido_id = v_pedido_id 
  AND id != p_pedido_video_id;
  
  -- Marcar este vídeo como base
  UPDATE public.pedido_videos 
  SET is_base_video = true, updated_at = now()
  WHERE id = p_pedido_video_id;
  
  RETURN TRUE;
END;
$$;

-- 3. Criar função para determinar qual vídeo exibir agora
CREATE OR REPLACE FUNCTION public.get_current_display_video(p_pedido_id uuid)
RETURNS TABLE(video_id uuid, is_scheduled boolean, priority_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_current_day integer;
  v_current_time time;
  v_scheduled_video uuid;
  v_base_video uuid;
BEGIN
  -- Obter hora atual
  v_current_day := EXTRACT(DOW FROM NOW());
  v_current_time := NOW()::time;
  
  -- Verificar se há vídeo agendado ativo neste momento
  SELECT pv.video_id INTO v_scheduled_video
  FROM public.pedido_videos pv
  JOIN public.campaign_video_schedules cvs ON cvs.video_id = pv.video_id
  JOIN public.campaign_schedule_rules csr ON csr.campaign_video_schedule_id = cvs.id
  WHERE pv.pedido_id = p_pedido_id
  AND pv.approval_status = 'approved'
  AND pv.is_active = true
  AND csr.is_active = true
  AND v_current_day = ANY(csr.days_of_week)
  AND v_current_time BETWEEN csr.start_time AND csr.end_time
  ORDER BY cvs.priority DESC
  LIMIT 1;
  
  -- Se há vídeo agendado, retornar ele
  IF v_scheduled_video IS NOT NULL THEN
    RETURN QUERY SELECT v_scheduled_video, true, 'scheduled'::text;
    RETURN;
  END IF;
  
  -- Caso contrário, retornar vídeo base
  SELECT pv.video_id INTO v_base_video
  FROM public.pedido_videos pv
  WHERE pv.pedido_id = p_pedido_id
  AND pv.approval_status = 'approved'
  AND pv.is_base_video = true
  LIMIT 1;
  
  IF v_base_video IS NOT NULL THEN
    RETURN QUERY SELECT v_base_video, false, 'base'::text;
  END IF;
  
  RETURN;
END;
$$;

-- 4. Atualizar trigger para proteger vídeo base
CREATE OR REPLACE FUNCTION public.prevent_base_video_removal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_remaining_approved_videos integer;
  v_contract_started boolean;
  v_is_base_video boolean;
BEGIN
  -- Verificar se é uma remoção (DELETE)
  IF TG_OP = 'DELETE' THEN
    -- Verificar se é vídeo base
    v_is_base_video := OLD.is_base_video;
    
    -- Verificar se o contrato já foi iniciado
    SELECT 
      data_inicio IS NOT NULL AND data_inicio <= CURRENT_DATE
    INTO v_contract_started
    FROM public.pedidos 
    WHERE id = OLD.pedido_id;
    
    -- Se contrato ainda não iniciou, permitir remoção
    IF NOT v_contract_started THEN
      RETURN OLD;
    END IF;
    
    -- Contar quantos vídeos aprovados restam (excluindo o que está sendo removido)
    SELECT COUNT(*) INTO v_remaining_approved_videos
    FROM public.pedido_videos 
    WHERE pedido_id = OLD.pedido_id 
    AND id != OLD.id
    AND approval_status = 'approved';
    
    -- Se é o último vídeo aprovado, bloquear remoção
    IF v_remaining_approved_videos = 0 THEN
      RAISE EXCEPTION 'CANNOT_REMOVE_LAST_VIDEO: Cannot remove the last approved video from an active contract. Upload another video first.';
    END IF;
    
    -- Se é vídeo base e há outros vídeos aprovados, usuário deve definir novo base primeiro
    IF v_is_base_video AND v_remaining_approved_videos > 0 THEN
      RAISE EXCEPTION 'CANNOT_REMOVE_BASE_VIDEO: Cannot remove base video. Please set another video as base first.';
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS prevent_last_video_removal_trigger ON public.pedido_videos;

-- Criar novo trigger que protege vídeo base
CREATE TRIGGER prevent_base_video_removal_trigger
  BEFORE DELETE ON public.pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_base_video_removal();

-- 5. Corrigir dados existentes - definir primeiro vídeo aprovado como base
UPDATE public.pedido_videos 
SET is_base_video = true, updated_at = now()
WHERE id IN (
  SELECT DISTINCT ON (pedido_id) id
  FROM public.pedido_videos 
  WHERE approval_status = 'approved'
  ORDER BY pedido_id, created_at ASC
);

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pedido_videos_base ON public.pedido_videos(pedido_id, is_base_video) 
WHERE is_base_video = true;

CREATE INDEX IF NOT EXISTS idx_pedido_videos_approved_active ON public.pedido_videos(pedido_id, approval_status, is_active) 
WHERE approval_status = 'approved' AND is_active = true;