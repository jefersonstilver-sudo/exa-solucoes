-- Criar função helper para inserir logs de sistema sem RLS
CREATE OR REPLACE FUNCTION public.insert_system_log(
  p_tipo_evento TEXT,
  p_descricao TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao,
    metadata,
    ip,
    user_agent
  ) VALUES (
    p_tipo_evento,
    p_descricao,
    p_metadata,
    p_ip,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Adicionar coluna metadata se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'log_eventos_sistema' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.log_eventos_sistema ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Atualizar função de deleção completa usando a função helper
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
  v_timestamp TEXT;
  v_video_record RECORD;
  v_video_count INTEGER := 0;
  v_files_deleted INTEGER := 0;
BEGIN
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  v_current_user_id := auth.uid();
  
  RAISE NOTICE '%', '========================================';
  RAISE NOTICE '[%] 🚀 FUNÇÃO INICIADA', v_timestamp;
  RAISE NOTICE '%', '========================================';
  RAISE NOTICE '[%] User ID: %', v_timestamp, v_current_user_id;
  RAISE NOTICE '[%] Pedido ID: %', v_timestamp, p_pedido_id;
  
  -- Buscar role do usuário
  SELECT role INTO v_user_role
  FROM public.users
  WHERE id = v_current_user_id;
  
  RAISE NOTICE '[%] Role do usuário: %', v_timestamp, v_user_role;
  
  -- Verificar se é super admin
  v_is_super_admin := public.is_current_user_super_admin();
  RAISE NOTICE '[%] É super admin? %', v_timestamp, v_is_super_admin;
  
  IF NOT v_is_super_admin THEN
    RAISE NOTICE '[%] ❌ ACESSO NEGADO', v_timestamp;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas super admins podem deletar pedidos completamente',
      'timestamp', v_timestamp
    );
  END IF;
  
  RAISE NOTICE '[%] ✅ ACESSO PERMITIDO', v_timestamp;
  
  v_deleted_by := auth.uid();
  
  -- Capturar dados do pedido
  RAISE NOTICE '[%] 📥 Capturando dados do pedido...', v_timestamp;
  SELECT row_to_json(p.*) INTO v_pedido_data
  FROM public.pedidos p
  WHERE p.id = p_pedido_id;
  
  IF v_pedido_data IS NULL THEN
    RAISE NOTICE '[%] ❌ Pedido não encontrado', v_timestamp;
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado');
  END IF;
  
  RAISE NOTICE '[%] ✅ Pedido encontrado', v_timestamp;
  
  -- Contar vídeos
  SELECT COUNT(*) INTO v_video_count
  FROM public.pedido_videos
  WHERE pedido_id = p_pedido_id;
  
  RAISE NOTICE '[%] 📹 Total de vídeos: %', v_timestamp, v_video_count;
  
  -- Capturar dados dos vídeos
  SELECT jsonb_agg(row_to_json(pv.*)) INTO v_videos_data
  FROM public.pedido_videos pv
  WHERE pv.pedido_id = p_pedido_id;
  
  -- Salvar histórico
  RAISE NOTICE '[%] 💾 Salvando histórico...', v_timestamp;
  INSERT INTO public.pedidos_deletion_history (
    pedido_id, pedido_data, deleted_by, justification,
    ip_address, user_agent, videos_deleted, metadata
  ) VALUES (
    p_pedido_id, v_pedido_data, v_deleted_by, p_justification,
    p_ip_address, p_user_agent, COALESCE(v_videos_data, '[]'::jsonb),
    jsonb_build_object(
      'total_videos', v_video_count,
      'deleted_at_timestamp', now(),
      'deleted_by_user_id', v_deleted_by,
      'deleted_by_role', v_user_role
    )
  );
  RAISE NOTICE '[%] ✅ Histórico salvo', v_timestamp;
  
  -- Deletar vídeos
  RAISE NOTICE '[%] 🗑️  Deletando registros de vídeos...', v_timestamp;
  DELETE FROM public.pedido_videos WHERE pedido_id = p_pedido_id;
  RAISE NOTICE '[%] ✅ Vídeos deletados', v_timestamp;
  
  -- Deletar pedido
  RAISE NOTICE '[%] 🗑️  Deletando pedido...', v_timestamp;
  DELETE FROM public.pedidos WHERE id = p_pedido_id;
  RAISE NOTICE '[%] ✅ Pedido deletado', v_timestamp;
  
  -- Registrar evento usando função helper (bypass RLS)
  RAISE NOTICE '[%] 📝 Registrando evento no log...', v_timestamp;
  PERFORM public.insert_system_log(
    'SUPER_ADMIN_DELETE_PEDIDO',
    format('[%s] Super admin deletou pedido %s. Justificativa: %s', v_timestamp, p_pedido_id, p_justification),
    jsonb_build_object(
      'pedido_id', p_pedido_id,
      'deleted_by', v_deleted_by,
      'deleted_by_role', v_user_role,
      'justification', p_justification,
      'videos_count', v_video_count,
      'timestamp', v_timestamp
    ),
    p_ip_address,
    p_user_agent
  );
  RAISE NOTICE '[%] ✅ Log registrado', v_timestamp;
  
  RAISE NOTICE '%', '========================================';
  RAISE NOTICE '[%] ✅ DELEÇÃO CONCLUÍDA COM SUCESSO', v_timestamp;
  RAISE NOTICE '[%] Pedido: %', v_timestamp, p_pedido_id;
  RAISE NOTICE '[%] Vídeos: %', v_timestamp, v_video_count;
  RAISE NOTICE '%', '========================================';
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_pedido_id', p_pedido_id,
    'videos_deleted', v_video_count,
    'timestamp', v_timestamp
  );
  
EXCEPTION
  WHEN OTHERS THEN
    v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
    RAISE NOTICE '%', '========================================';
    RAISE NOTICE '[%] 💥 ERRO FATAL', v_timestamp;
    RAISE NOTICE '[%] SQL State: %', v_timestamp, SQLSTATE;
    RAISE NOTICE '[%] Mensagem: %', v_timestamp, SQLERRM;
    RAISE NOTICE '%', '========================================';
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sql_state', SQLSTATE,
      'timestamp', v_timestamp
    );
END;
$$;