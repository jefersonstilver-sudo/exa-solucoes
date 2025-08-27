
-- Função robusta e transacional para definir vídeo base e seleção de exibição
CREATE OR REPLACE FUNCTION public.set_base_video_enhanced(p_pedido_video_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_slot RECORD;
  v_pedido_id uuid;
BEGIN
  -- Buscar o slot e validar aprovação
  SELECT id, pedido_id, video_id, approval_status
  INTO v_slot
  FROM public.pedido_videos
  WHERE id = p_pedido_video_id;

  IF v_slot.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'SLOT_NOT_FOUND');
  END IF;

  IF v_slot.approval_status <> 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'VIDEO_NOT_APPROVED');
  END IF;

  v_pedido_id := v_slot.pedido_id;

  -- Bloquear todas as linhas desse pedido para evitar concorrência
  PERFORM 1
  FROM public.pedido_videos
  WHERE pedido_id = v_pedido_id
  FOR UPDATE;

  -- 1) Desmarcar seleção e base dos outros vídeos do mesmo pedido
  UPDATE public.pedido_videos
  SET
    selected_for_display = false,
    is_base_video = false,
    updated_at = now()
  WHERE pedido_id = v_pedido_id
    AND id <> p_pedido_video_id
    AND (selected_for_display = true OR is_base_video = true);

  -- 2) Marcar este como base + selecionado + ativo
  UPDATE public.pedido_videos
  SET
    is_base_video = true,
    selected_for_display = true,
    is_active = true,
    updated_at = now()
  WHERE id = p_pedido_video_id;

  -- 3) Opcional: desativar regras de agendamento ligadas a este vídeo (mantém coerência com o fallback do app)
  UPDATE public.campaign_schedule_rules csr
  SET is_active = false,
      updated_at = now()
  WHERE csr.is_active = true
    AND csr.campaign_video_schedule_id IN (
      SELECT cvs.id
      FROM public.campaign_video_schedules cvs
      WHERE cvs.video_id = v_slot.video_id
    );

  RETURN jsonb_build_object(
    'success', true,
    'pedido_id', v_pedido_id,
    'pedido_video_id', p_pedido_video_id,
    'timestamp', now()
  );

EXCEPTION
  WHEN unique_violation THEN
    -- Captura violação da idx_pedido_videos_one_selected e retorna erro amigável
    RETURN jsonb_build_object('success', false, 'error', 'UNIQUE_SELECTED_CONFLICT');
  WHEN others THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Wrapper de compatibilidade que retorna boolean, usado como fallback por alguns clientes
CREATE OR REPLACE FUNCTION public.set_base_video(p_pedido_video_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT public.set_base_video_enhanced(p_pedido_video_id) INTO v_result;
  RETURN COALESCE((v_result->>'success')::boolean, false);
END;
$function$;
