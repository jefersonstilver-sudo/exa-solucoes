
-- 1) Função segura para exclusão em massa de pedidos com auditoria
CREATE OR REPLACE FUNCTION public.bulk_delete_pedidos_secure(
  p_pedido_ids uuid[],
  p_justificativa text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_is_admin boolean;
  v_total_requested int := COALESCE(array_length(p_pedido_ids, 1), 0);
  v_to_delete int := 0;
  v_deleted int := 0;
BEGIN
  -- Verificar permissão (admin ou super_admin)
  SELECT EXISTS(
    SELECT 1 FROM public.users u
    WHERE u.id = v_admin_id AND u.role IN ('admin','super_admin')
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'deleted_count', 0,
      'total_requested', v_total_requested,
      'error', 'Insufficient permissions'
    );
  END IF;

  IF v_total_requested = 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'deleted_count', 0,
      'total_requested', 0
    );
  END IF;

  -- Quantos existem de fato
  SELECT COUNT(*) INTO v_to_delete
  FROM public.pedidos p
  WHERE p.id = ANY(p_pedido_ids);

  -- Limpeza de relacionamentos conhecidos antes de apagar pedidos
  -- 1) Regras e agendamentos de campanhas associadas aos pedidos
  DELETE FROM public.campaign_schedule_rules csr
  WHERE csr.campaign_video_schedule_id IN (
    SELECT cvs.id
    FROM public.campaign_video_schedules cvs
    JOIN public.campaigns_advanced ca ON ca.id = cvs.campaign_id
    WHERE ca.pedido_id = ANY(p_pedido_ids)
  );

  DELETE FROM public.campaign_video_schedules cvs
  WHERE cvs.campaign_id IN (
    SELECT ca.id
    FROM public.campaigns_advanced ca
    WHERE ca.pedido_id = ANY(p_pedido_ids)
  );

  DELETE FROM public.campaigns_advanced ca
  WHERE ca.pedido_id = ANY(p_pedido_ids);

  -- 2) Vídeos e logs
  DELETE FROM public.pedido_videos pv
  WHERE pv.pedido_id = ANY(p_pedido_ids);

  DELETE FROM public.video_management_logs vml
  WHERE vml.pedido_id = ANY(p_pedido_ids);

  -- 3) Sessões de transação e trilhas de status/pagamento
  DELETE FROM public.transaction_sessions ts
  WHERE ts.pedido_id = ANY(p_pedido_ids);

  DELETE FROM public.payment_processing_control ppc
  WHERE ppc.pedido_id = ANY(p_pedido_ids);

  -- 4) Logs de bloqueio
  DELETE FROM public.pedido_blocking_logs pbl
  WHERE pbl.pedido_id = ANY(p_pedido_ids);

  -- Finalmente, apagar os pedidos
  DELETE FROM public.pedidos p
  WHERE p.id = ANY(p_pedido_ids);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Auditoria
  INSERT INTO public.log_eventos_sistema (tipo_evento, descricao, ip, user_agent)
  VALUES (
    'BULK_DELETE_PEDIDOS',
    format('Admin %s apagou %s/%s pedidos. Justificativa: %s. IDs: %s',
      v_admin_id, v_deleted, v_total_requested, COALESCE(p_justificativa, 'N/A'), array_to_string(p_pedido_ids, ',')
    ),
    p_ip_address, p_user_agent
  );

  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted,
    'total_requested', v_total_requested
  );
END;
$$;

-- 2) Permitir que admins/super_admins apaguem tentativas (além do próprio usuário)
DROP POLICY IF EXISTS "Admins can delete any attempts" ON public.tentativas_compra;
CREATE POLICY "Admins can delete any attempts"
  ON public.tentativas_compra
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin','super_admin')
    ) OR auth.uid() = id_user
  );
