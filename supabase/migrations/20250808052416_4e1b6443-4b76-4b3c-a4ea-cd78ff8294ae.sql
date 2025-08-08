-- Criar tabela de logs de gerenciamento de vídeo
CREATE TABLE public.video_management_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL,
  action_type text NOT NULL, -- 'set_base_video', 'schedule_activated', 'schedule_deactivated', etc
  slot_from integer, -- slot anterior
  slot_to integer, -- slot novo  
  video_from_id uuid, -- vídeo anterior
  video_to_id uuid, -- vídeo novo
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.video_management_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view logs of accessible orders" 
ON public.video_management_logs 
FOR SELECT 
USING (can_access_order(pedido_id));

CREATE POLICY "Admins can view all logs" 
ON public.video_management_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'super_admin')
));

-- Função aprimorada para definir vídeo base
CREATE OR REPLACE FUNCTION public.set_base_video_enhanced(p_pedido_video_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_pedido_id uuid;
  v_video_id uuid;
  v_slot_position integer;
  v_approval_status text;
  v_old_base_video RECORD;
  v_result jsonb;
BEGIN
  -- Verificar se o vídeo existe e está aprovado
  SELECT pedido_id, video_id, slot_position, approval_status 
  INTO v_pedido_id, v_video_id, v_slot_position, v_approval_status
  FROM public.pedido_videos 
  WHERE id = p_pedido_video_id;
  
  IF v_pedido_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Vídeo não encontrado'
    );
  END IF;
  
  -- Só vídeos aprovados podem ser base
  IF v_approval_status != 'approved' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas vídeos aprovados podem ser definidos como base'
    );
  END IF;
  
  -- Obter informações do vídeo base atual
  SELECT pv.slot_position, pv.video_id 
  INTO v_old_base_video
  FROM public.pedido_videos pv
  WHERE pv.pedido_id = v_pedido_id 
  AND pv.is_base_video = true
  LIMIT 1;
  
  -- Desmarcar outros vídeos base do mesmo pedido
  UPDATE public.pedido_videos 
  SET is_base_video = false, updated_at = now()
  WHERE pedido_id = v_pedido_id 
  AND id != p_pedido_video_id;
  
  -- Marcar este vídeo como base
  UPDATE public.pedido_videos 
  SET is_base_video = true, updated_at = now()
  WHERE id = p_pedido_video_id;
  
  -- NOVO: Desativar agendamentos do vídeo promovido a principal
  UPDATE public.campaign_schedule_rules 
  SET is_active = false, updated_at = now()
  WHERE campaign_video_schedule_id IN (
    SELECT cvs.id 
    FROM public.campaign_video_schedules cvs
    WHERE cvs.video_id = v_video_id
  );
  
  -- Registrar no log de gerenciamento
  INSERT INTO public.video_management_logs (
    pedido_id,
    action_type,
    slot_from,
    slot_to,
    video_from_id,
    video_to_id,
    details
  ) VALUES (
    v_pedido_id,
    'set_base_video',
    v_old_base_video.slot_position,
    v_slot_position,
    v_old_base_video.video_id,
    v_video_id,
    jsonb_build_object(
      'previous_base_slot', v_old_base_video.slot_position,
      'new_base_slot', v_slot_position,
      'schedules_deactivated', true,
      'pedido_video_id', p_pedido_video_id
    )
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Vídeo definido como base com sucesso',
    'previous_base_slot', v_old_base_video.slot_position,
    'new_base_slot', v_slot_position,
    'schedules_deactivated', true
  );
  
  RETURN v_result;
END;
$function$;