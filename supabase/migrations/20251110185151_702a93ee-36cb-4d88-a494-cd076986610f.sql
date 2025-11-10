-- Adicionar logs detalhados na função de deleção para debug
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
  v_is_super_admin BOOLEAN;
  v_current_user_id UUID;
  v_user_role TEXT;
BEGIN
  -- Log 1: Início da função
  RAISE NOTICE '[DELETE_DEBUG] Função iniciada para pedido %', p_pedido_id;
  
  -- Log 2: Capturar informações do usuário atual
  v_current_user_id := auth.uid();
  RAISE NOTICE '[DELETE_DEBUG] User ID atual: %', v_current_user_id;
  
  -- Log 3: Buscar role do usuário
  SELECT role INTO v_user_role
  FROM public.users
  WHERE id = v_current_user_id;
  
  RAISE NOTICE '[DELETE_DEBUG] Role do usuário: %', v_user_role;
  
  -- Log 4: Verificar se é super admin
  v_is_super_admin := public.is_current_user_super_admin();
  RAISE NOTICE '[DELETE_DEBUG] É super admin? %', v_is_super_admin;
  
  -- Verificar se o usuário é super admin
  IF NOT v_is_super_admin THEN
    RAISE NOTICE '[DELETE_DEBUG] ❌ Acesso negado - não é super admin';
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas super admins podem deletar pedidos completamente',
      'debug', jsonb_build_object(
        'user_id', v_current_user_id,
        'user_role', v_user_role,
        'is_super_admin', v_is_super_admin
      )
    );
  END IF;
  
  RAISE NOTICE '[DELETE_DEBUG] ✅ Acesso permitido - é super admin';
  
  v_deleted_by := auth.uid();
  
  -- Log 5: Capturar dados do pedido
  RAISE NOTICE '[DELETE_DEBUG] Capturando dados do pedido...';
  SELECT row_to_json(p.*) INTO v_pedido_data
  FROM public.pedidos p
  WHERE p.id = p_pedido_id;
  
  IF v_pedido_data IS NULL THEN
    RAISE NOTICE '[DELETE_DEBUG] ❌ Pedido não encontrado';
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pedido não encontrado'
    );
  END IF;
  
  RAISE NOTICE '[DELETE_DEBUG] Pedido encontrado: %', p_pedido_id;
  
  -- Log 6: Capturar dados dos vídeos
  RAISE NOTICE '[DELETE_DEBUG] Capturando vídeos...';
  SELECT jsonb_agg(row_to_json(pv.*)) INTO v_videos_data
  FROM public.pedido_videos pv
  WHERE pv.pedido_id = p_pedido_id;
  
  RAISE NOTICE '[DELETE_DEBUG] Total de vídeos: %', jsonb_array_length(COALESCE(v_videos_data, '[]'::jsonb));
  
  -- Log 7: Salvar histórico
  RAISE NOTICE '[DELETE_DEBUG] Salvando histórico...';
  INSERT INTO public.pedidos_deletion_history (
    pedido_id,
    pedido_data,
    deleted_by,
    justification,
    ip_address,
    user_agent,
    videos_deleted,
    metadata
  ) VALUES (
    p_pedido_id,
    v_pedido_data,
    v_deleted_by,
    p_justification,
    p_ip_address,
    p_user_agent,
    COALESCE(v_videos_data, '[]'::jsonb),
    jsonb_build_object(
      'total_videos', (SELECT COUNT(*) FROM public.pedido_videos WHERE pedido_id = p_pedido_id),
      'deleted_at_timestamp', now()
    )
  );
  
  RAISE NOTICE '[DELETE_DEBUG] Histórico salvo';
  
  -- Log 8: Deletar vídeos
  RAISE NOTICE '[DELETE_DEBUG] Deletando vídeos...';
  DELETE FROM public.pedido_videos WHERE pedido_id = p_pedido_id;
  RAISE NOTICE '[DELETE_DEBUG] Vídeos deletados';
  
  -- Log 9: Deletar pedido
  RAISE NOTICE '[DELETE_DEBUG] Deletando pedido...';
  DELETE FROM public.pedidos WHERE id = p_pedido_id;
  RAISE NOTICE '[DELETE_DEBUG] Pedido deletado';
  
  -- Log 10: Log do evento
  INSERT INTO public.log_eventos_sistema (tipo_evento, descricao, metadata)
  VALUES (
    'SUPER_ADMIN_DELETE_PEDIDO',
    format('Super admin deletou pedido %s. Justificativa: %s', p_pedido_id, p_justification),
    jsonb_build_object(
      'pedido_id', p_pedido_id,
      'deleted_by', v_deleted_by,
      'justification', p_justification,
      'videos_deleted', COALESCE(v_videos_data, '[]'::jsonb)
    )
  );
  
  RAISE NOTICE '[DELETE_DEBUG] ✅ Deleção concluída com sucesso';
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_pedido_id', p_pedido_id,
    'videos_deleted', jsonb_array_length(COALESCE(v_videos_data, '[]'::jsonb))
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '[DELETE_DEBUG] 💥 Erro: % - %', SQLSTATE, SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sql_state', SQLSTATE
    );
END;
$$;