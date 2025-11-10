-- Atualizar função em massa com logs extremamente detalhados
CREATE OR REPLACE FUNCTION public.super_admin_bulk_delete_pedidos(
  p_pedido_ids UUID[],
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
  v_deleted_count INTEGER := 0;
  v_total_requested INTEGER;
  v_pedido_id UUID;
  v_result JSONB;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_timestamp TEXT;
  v_is_super_admin BOOLEAN;
  v_current_user_id UUID;
  v_separator TEXT := '========================================';
BEGIN
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  v_current_user_id := auth.uid();
  
  -- Log inicial
  RAISE NOTICE '%', v_separator;
  RAISE NOTICE '[%] 🚀 FUNÇÃO EM MASSA INICIADA', v_timestamp;
  RAISE NOTICE '%', v_separator;
  RAISE NOTICE '[%] User ID: %', v_timestamp, v_current_user_id;
  RAISE NOTICE '[%] Total de pedidos: %', v_timestamp, array_length(p_pedido_ids, 1);
  RAISE NOTICE '[%] Justificativa: %', v_timestamp, p_justification;
  RAISE NOTICE '[%] Primeiros IDs: %', v_timestamp, p_pedido_ids[1:3];
  RAISE NOTICE '%', v_separator;
  
  -- Verificar se o usuário é super admin
  v_is_super_admin := public.is_current_user_super_admin();
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  
  RAISE NOTICE '[%] ✅ Verificação de super admin: %', v_timestamp, v_is_super_admin;
  
  IF NOT v_is_super_admin THEN
    v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
    RAISE NOTICE '[%] ❌ ACESSO NEGADO - não é super admin', v_timestamp;
    RAISE NOTICE '%', v_separator;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas super admins podem deletar pedidos em massa',
      'deleted_count', 0,
      'total_requested', array_length(p_pedido_ids, 1),
      'timestamp', v_timestamp
    );
  END IF;
  
  v_total_requested := array_length(p_pedido_ids, 1);
  
  RAISE NOTICE '[%] 🔄 Iniciando loop de deleção...', v_timestamp;
  RAISE NOTICE '%', v_separator;
  
  -- Deletar cada pedido
  FOREACH v_pedido_id IN ARRAY p_pedido_ids
  LOOP
    BEGIN
      v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
      RAISE NOTICE '[%] 📝 Processando pedido: %', v_timestamp, v_pedido_id;
      
      v_result := public.super_admin_delete_pedido_complete(
        v_pedido_id,
        p_justification,
        p_ip_address,
        p_user_agent
      );
      
      v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
      
      IF (v_result->>'success')::boolean THEN
        v_deleted_count := v_deleted_count + 1;
        RAISE NOTICE '[%] ✅ Pedido % deletado com sucesso (% vídeos, % arquivos)', 
          v_timestamp, 
          v_pedido_id, 
          COALESCE((v_result->>'videos_deleted')::integer, 0),
          COALESCE((v_result->>'files_deleted')::integer, 0);
      ELSE
        v_errors := array_append(v_errors, format('Pedido %s: %s', v_pedido_id, v_result->>'error'));
        RAISE NOTICE '[%] ❌ Falha ao deletar pedido %: %', v_timestamp, v_pedido_id, v_result->>'error';
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
        v_errors := array_append(v_errors, format('Pedido %s: %s (SQL State: %s)', v_pedido_id, SQLERRM, SQLSTATE));
        RAISE NOTICE '[%] 💥 EXCEÇÃO ao deletar pedido %', v_timestamp, v_pedido_id;
        RAISE NOTICE '[%]    SQL State: %', v_timestamp, SQLSTATE;
        RAISE NOTICE '[%]    Mensagem: %', v_timestamp, SQLERRM;
    END;
  END LOOP;
  
  v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
  RAISE NOTICE '%', v_separator;
  RAISE NOTICE '[%] 🏁 DELEÇÃO EM MASSA CONCLUÍDA', v_timestamp;
  RAISE NOTICE '[%] ✅ Deletados: % de %', v_timestamp, v_deleted_count, v_total_requested;
  RAISE NOTICE '[%] ❌ Erros: %', v_timestamp, array_length(v_errors, 1);
  IF array_length(v_errors, 1) > 0 THEN
    RAISE NOTICE '[%] Lista de erros: %', v_timestamp, array_to_json(v_errors);
  END IF;
  RAISE NOTICE '%', v_separator;
  
  RETURN jsonb_build_object(
    'success', v_deleted_count > 0,
    'deleted_count', v_deleted_count,
    'total_requested', v_total_requested,
    'errors', array_to_json(v_errors),
    'timestamp', v_timestamp
  );
  
EXCEPTION
  WHEN OTHERS THEN
    v_timestamp := to_char(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS.MS');
    RAISE NOTICE '%', v_separator;
    RAISE NOTICE '[%] 💥 ERRO FATAL NA FUNÇÃO EM MASSA', v_timestamp;
    RAISE NOTICE '[%] SQL State: %', v_timestamp, SQLSTATE;
    RAISE NOTICE '[%] Mensagem: %', v_timestamp, SQLERRM;
    RAISE NOTICE '%', v_separator;
    
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Erro fatal: %s (State: %s)', SQLERRM, SQLSTATE),
      'deleted_count', v_deleted_count,
      'total_requested', v_total_requested,
      'timestamp', v_timestamp
    );
END;
$$;