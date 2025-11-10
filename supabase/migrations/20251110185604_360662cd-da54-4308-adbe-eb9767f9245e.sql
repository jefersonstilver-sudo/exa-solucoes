-- Função aprimorada de deleção completa de pedido com logs detalhados e deleção de arquivos
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
  -- Função helper para timestamp
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  
  -- Log 1: Início da função
  RAISE NOTICE '[%] [DELETE_DEBUG] ============================================', v_timestamp;
  RAISE NOTICE '[%] [DELETE_DEBUG] Função iniciada para pedido %', v_timestamp, p_pedido_id;
  RAISE NOTICE '[%] [DELETE_DEBUG] Justificativa: %', v_timestamp, p_justification;
  
  -- Log 2: Capturar informações do usuário atual
  v_current_user_id := auth.uid();
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] User ID atual: %', v_timestamp, v_current_user_id;
  
  -- Log 3: Buscar role do usuário
  SELECT role INTO v_user_role
  FROM public.users
  WHERE id = v_current_user_id;
  
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] Role do usuário: %', v_timestamp, v_user_role;
  
  -- Log 4: Verificar se é super admin
  v_is_super_admin := public.is_current_user_super_admin();
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] É super admin? %', v_timestamp, v_is_super_admin;
  
  -- Verificar se o usuário é super admin
  IF NOT v_is_super_admin THEN
    v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
    RAISE NOTICE '[%] [DELETE_DEBUG] ❌ ACESSO NEGADO - não é super admin', v_timestamp;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas super admins podem deletar pedidos completamente',
      'debug', jsonb_build_object(
        'user_id', v_current_user_id,
        'user_role', v_user_role,
        'is_super_admin', v_is_super_admin,
        'timestamp', v_timestamp
      )
    );
  END IF;
  
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] ✅ ACESSO PERMITIDO - é super admin', v_timestamp;
  
  v_deleted_by := auth.uid();
  
  -- Log 5: Capturar dados do pedido
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] Capturando dados do pedido...', v_timestamp;
  
  SELECT row_to_json(p.*) INTO v_pedido_data
  FROM public.pedidos p
  WHERE p.id = p_pedido_id;
  
  IF v_pedido_data IS NULL THEN
    v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
    RAISE NOTICE '[%] [DELETE_DEBUG] ❌ Pedido não encontrado: %', v_timestamp, p_pedido_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pedido não encontrado',
      'timestamp', v_timestamp
    );
  END IF;
  
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] ✅ Pedido encontrado: %', v_timestamp, p_pedido_id;
  RAISE NOTICE '[%] [DELETE_DEBUG] Dados do pedido: %', v_timestamp, v_pedido_data;
  
  -- Log 6: Capturar e processar vídeos (INCLUINDO DELEÇÃO DE ARQUIVOS)
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] Capturando vídeos para deleção física...', v_timestamp;
  
  -- Primeiro contar os vídeos
  SELECT COUNT(*) INTO v_video_count
  FROM public.pedido_videos pv
  WHERE pv.pedido_id = p_pedido_id;
  
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] Total de vídeos encontrados: %', v_timestamp, v_video_count;
  
  -- Se houver vídeos, deletar os arquivos físicos primeiro
  IF v_video_count > 0 THEN
    v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
    RAISE NOTICE '[%] [DELETE_DEBUG] Iniciando deleção de arquivos físicos...', v_timestamp;
    
    FOR v_video_record IN 
      SELECT pv.video_id, pv.pedido_id, v.url, v.nome
      FROM public.pedido_videos pv
      JOIN public.videos v ON v.id = pv.video_id
      WHERE pv.pedido_id = p_pedido_id
    LOOP
      BEGIN
        v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
        RAISE NOTICE '[%] [DELETE_DEBUG] Deletando arquivo físico do vídeo: % (URL: %)', 
          v_timestamp, v_video_record.video_id, v_video_record.url;
        
        -- Chamar edge function para deletar arquivo físico
        PERFORM net.http_post(
          url := current_setting('app.settings.supabase_url') || '/functions/v1/delete-video-from-external-api',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
          ),
          body := jsonb_build_object(
            'video_id', v_video_record.video_id,
            'pedido_id', v_video_record.pedido_id
          )
        );
        
        v_files_deleted := v_files_deleted + 1;
        v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
        RAISE NOTICE '[%] [DELETE_DEBUG] ✅ Arquivo físico deletado: %', v_timestamp, v_video_record.video_id;
        
      EXCEPTION
        WHEN OTHERS THEN
          v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
          RAISE NOTICE '[%] [DELETE_DEBUG] ⚠️ Erro ao deletar arquivo físico (continuando): % - %', 
            v_timestamp, SQLSTATE, SQLERRM;
      END;
    END LOOP;
    
    v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
    RAISE NOTICE '[%] [DELETE_DEBUG] Arquivos físicos processados: % de %', 
      v_timestamp, v_files_deleted, v_video_count;
  END IF;
  
  -- Capturar dados dos vídeos para histórico
  SELECT jsonb_agg(row_to_json(pv.*)) INTO v_videos_data
  FROM public.pedido_videos pv
  WHERE pv.pedido_id = p_pedido_id;
  
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] Dados dos vídeos capturados para histórico', v_timestamp;
  
  -- Log 7: Salvar histórico
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] Salvando histórico de deleção...', v_timestamp;
  
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
      'total_videos', v_video_count,
      'files_deleted', v_files_deleted,
      'deleted_at_timestamp', now(),
      'deleted_by_user_id', v_deleted_by,
      'deleted_by_role', v_user_role
    )
  );
  
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] ✅ Histórico salvo com sucesso', v_timestamp;
  
  -- Log 8: Deletar registros de vídeos do banco
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] Deletando registros de vídeos do banco...', v_timestamp;
  
  DELETE FROM public.pedido_videos WHERE pedido_id = p_pedido_id;
  
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] ✅ Registros de vídeos deletados do banco', v_timestamp;
  
  -- Log 9: Deletar pedido
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] Deletando pedido do banco...', v_timestamp;
  
  DELETE FROM public.pedidos WHERE id = p_pedido_id;
  
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] ✅ Pedido deletado do banco', v_timestamp;
  
  -- Log 10: Registrar evento no sistema
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] Registrando evento no log do sistema...', v_timestamp;
  
  INSERT INTO public.log_eventos_sistema (tipo_evento, descricao, metadata)
  VALUES (
    'SUPER_ADMIN_DELETE_PEDIDO',
    format('[%s] Super admin deletou pedido %s. Justificativa: %s', v_timestamp, p_pedido_id, p_justification),
    jsonb_build_object(
      'pedido_id', p_pedido_id,
      'deleted_by', v_deleted_by,
      'deleted_by_role', v_user_role,
      'justification', p_justification,
      'videos_count', v_video_count,
      'files_deleted', v_files_deleted,
      'timestamp', v_timestamp
    )
  );
  
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '[%] [DELETE_DEBUG] ============================================', v_timestamp;
  RAISE NOTICE '[%] [DELETE_DEBUG] ✅ DELEÇÃO CONCLUÍDA COM SUCESSO', v_timestamp;
  RAISE NOTICE '[%] [DELETE_DEBUG] Pedido: %', v_timestamp, p_pedido_id;
  RAISE NOTICE '[%] [DELETE_DEBUG] Vídeos deletados: %', v_timestamp, v_video_count;
  RAISE NOTICE '[%] [DELETE_DEBUG] Arquivos físicos deletados: %', v_timestamp, v_files_deleted;
  RAISE NOTICE '[%] [DELETE_DEBUG] ============================================', v_timestamp;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_pedido_id', p_pedido_id,
    'videos_deleted', v_video_count,
    'files_deleted', v_files_deleted,
    'timestamp', v_timestamp
  );
  
EXCEPTION
  WHEN OTHERS THEN
    v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
    RAISE NOTICE '[%] [DELETE_DEBUG] ============================================', v_timestamp;
    RAISE NOTICE '[%] [DELETE_DEBUG] 💥 ERRO FATAL', v_timestamp;
    RAISE NOTICE '[%] [DELETE_DEBUG] SQL State: %', v_timestamp, SQLSTATE;
    RAISE NOTICE '[%] [DELETE_DEBUG] Mensagem: %', v_timestamp, SQLERRM;
    RAISE NOTICE '[%] [DELETE_DEBUG] ============================================', v_timestamp;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sql_state', SQLSTATE,
      'timestamp', v_timestamp
    );
END;
$$;