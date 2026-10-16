CREATE OR REPLACE FUNCTION public.admin_extend_reactivate_order(p_pedido_id uuid, p_new_end date, p_reactivate boolean DEFAULT true)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_old record;
  v_reactivated boolean := false;
  v_display_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid AND role::text = 'super_admin') THEN
    RAISE EXCEPTION 'Apenas super admin pode estender ou reativar pedidos';
  END IF;
  IF p_new_end IS NULL OR p_new_end < CURRENT_DATE OR p_new_end > DATE '2099-12-31' THEN
    RAISE EXCEPTION 'Data final inválida';
  END IF;

  SELECT id, status, data_inicio, data_fim INTO v_old FROM public.pedidos WHERE id = p_pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF v_old.data_inicio IS NOT NULL AND p_new_end < v_old.data_inicio THEN
    RAISE EXCEPTION 'Data final anterior ao início da vigência';
  END IF;

  UPDATE public.pedidos SET data_fim = p_new_end WHERE id = p_pedido_id;

  IF p_reactivate AND v_old.status IN ('finalizado','bloqueado','cancelado','cancelado_automaticamente','ativo','video_aprovado') THEN
    IF v_old.status IN ('finalizado','bloqueado','cancelado','cancelado_automaticamente') THEN
      UPDATE public.pedidos SET status = 'ativo', blocked_reason = NULL, blocked_at = NULL, blocked_by = NULL WHERE id = p_pedido_id;
      v_reactivated := true;
    END IF;

    UPDATE public.pedido_videos SET is_active = true, updated_at = now()
      WHERE pedido_id = p_pedido_id AND approval_status = 'approved' AND is_active = false;

    IF NOT EXISTS (SELECT 1 FROM public.pedido_videos WHERE pedido_id = p_pedido_id AND selected_for_display = true AND approval_status = 'approved') THEN
      SELECT id INTO v_display_id FROM public.pedido_videos
        WHERE pedido_id = p_pedido_id AND approval_status = 'approved'
        ORDER BY is_base_video DESC, slot_position ASC LIMIT 1;
      IF v_display_id IS NOT NULL THEN
        UPDATE public.pedido_videos SET selected_for_display = true, updated_at = now() WHERE id = v_display_id;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.pedido_blocking_logs (pedido_id, action_type, reason, performed_by, details)
  VALUES (p_pedido_id, CASE WHEN v_reactivated THEN 'reactivated' ELSE 'extended' END,
          'Extensão/reativação manual por super admin', v_uid,
          jsonb_build_object('previous_status', v_old.status, 'previous_end', v_old.data_fim, 'new_end', p_new_end, 'indefinite', p_new_end = DATE '2099-12-31'));

  INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
  VALUES ('ORDER_EXTENDED', format('Pedido %s: término %s -> %s (status anterior %s, reativado=%s) por %s', p_pedido_id, v_old.data_fim, p_new_end, v_old.status, v_reactivated, v_uid));

  RETURN jsonb_build_object('success', true, 'reactivated', v_reactivated, 'previous_status', v_old.status, 'new_end', p_new_end);
END $$;
REVOKE ALL ON FUNCTION public.admin_extend_reactivate_order(uuid, date, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_extend_reactivate_order(uuid, date, boolean) TO authenticated;