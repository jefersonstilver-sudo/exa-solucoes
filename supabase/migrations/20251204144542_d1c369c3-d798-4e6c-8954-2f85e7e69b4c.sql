-- Função V2 completa para deletar pedidos de TODAS as tabelas relacionadas
CREATE OR REPLACE FUNCTION public.super_admin_delete_pedido_complete(
  p_pedido_id UUID,
  p_justification TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_data JSONB;
  v_videos_data JSONB;
  v_deleted_by UUID;
  v_video_count INTEGER := 0;
  v_building_ids TEXT[];
  v_client_id UUID;
  v_deleted_counts JSONB := '{}'::JSONB;
  v_count INTEGER;
BEGIN
  IF NOT public.is_current_user_super_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas super admins podem deletar pedidos');
  END IF;
  
  v_deleted_by := auth.uid();
  
  SELECT row_to_json(p.*), p.lista_predios, p.client_id INTO v_pedido_data, v_building_ids, v_client_id
  FROM public.pedidos p WHERE p.id = p_pedido_id;
  
  IF v_pedido_data IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado');
  END IF;
  
  SELECT COUNT(*), COALESCE(jsonb_agg(row_to_json(pv.*)), '[]'::jsonb)
  INTO v_video_count, v_videos_data FROM public.pedido_videos pv WHERE pv.pedido_id = p_pedido_id;
  
  -- Deletar de TODAS tabelas relacionadas
  DELETE FROM public.cobranca_logs WHERE pedido_id = p_pedido_id; GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted_counts := v_deleted_counts || jsonb_build_object('cobranca_logs', v_count);
  DELETE FROM public.parcelas WHERE pedido_id = p_pedido_id; GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted_counts := v_deleted_counts || jsonb_build_object('parcelas', v_count);
  DELETE FROM public.contratos WHERE pedido_id = p_pedido_id; GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted_counts := v_deleted_counts || jsonb_build_object('contratos', v_count);
  DELETE FROM public.contratos_legais WHERE pedido_id = p_pedido_id; GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted_counts := v_deleted_counts || jsonb_build_object('contratos_legais', v_count);
  DELETE FROM public.termos_fidelidade_aceites WHERE pedido_id = p_pedido_id;
  DELETE FROM public.cupom_usos WHERE pedido_id = p_pedido_id;
  DELETE FROM public.cupom_aplicacoes WHERE pedido_id = p_pedido_id;
  
  -- Desassociar propostas
  UPDATE public.proposals SET converted_order_id = NULL WHERE converted_order_id = p_pedido_id;
  
  PERFORM set_config('app.in_rpc_context', 'true', true);
  DELETE FROM public.pedido_videos WHERE pedido_id = p_pedido_id;
  PERFORM set_config('app.in_rpc_context', NULL, true);
  
  DELETE FROM public.campaign_schedule_rules WHERE campaign_video_schedule_id IN (SELECT id FROM public.campaign_video_schedules WHERE campaign_id IN (SELECT id FROM public.campaigns_advanced WHERE pedido_id = p_pedido_id));
  DELETE FROM public.campaign_video_schedules WHERE campaign_id IN (SELECT id FROM public.campaigns_advanced WHERE pedido_id = p_pedido_id);
  DELETE FROM public.campaigns_advanced WHERE pedido_id = p_pedido_id;
  
  INSERT INTO public.pedidos_deletion_history (pedido_id, pedido_data, deleted_by, justification, ip_address, user_agent, videos_deleted, metadata)
  VALUES (p_pedido_id, v_pedido_data, v_deleted_by, p_justification, p_ip_address, p_user_agent, v_videos_data,
    jsonb_build_object('deleted_counts', v_deleted_counts, 'version', 'v2'));
  
  DELETE FROM public.pedidos WHERE id = p_pedido_id;
  
  RETURN jsonb_build_object('success', true, 'deleted_pedido_id', p_pedido_id, 'deleted_counts', v_deleted_counts);
EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('app.in_rpc_context', NULL, true);
  RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'pedido_id', p_pedido_id);
END;
$$;