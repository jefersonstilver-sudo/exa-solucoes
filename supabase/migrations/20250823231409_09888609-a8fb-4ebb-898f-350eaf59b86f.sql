-- Função para exclusão em massa de pedidos (APENAS SUPER ADMIN)
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
  v_admin_id UUID;
  v_deleted_count integer := 0;
  v_pedido_id UUID;
  v_pedido_info RECORD;
  v_deleted_pedidos jsonb := '[]'::jsonb;
  v_result jsonb;
BEGIN
  -- Verificar se é super admin
  v_admin_id := auth.uid();
  
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = v_admin_id 
    AND role = 'super_admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only super admin can perform bulk delete'
    );
  END IF;
  
  -- Validar entrada
  IF array_length(p_pedido_ids, 1) IS NULL OR array_length(p_pedido_ids, 1) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No orders selected for deletion'
    );
  END IF;
  
  IF length(trim(coalesce(p_justificativa, ''))) < 10 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Justification must be at least 10 characters'
    );
  END IF;
  
  -- Processar cada pedido
  FOREACH v_pedido_id IN ARRAY p_pedido_ids
  LOOP
    -- Obter informações do pedido antes de excluir
    SELECT 
      id, status, valor_total, client_id, created_at,
      COALESCE(email, (SELECT email FROM users WHERE id = client_id)) as client_email
    INTO v_pedido_info
    FROM public.pedidos 
    WHERE id = v_pedido_id;
    
    -- Se pedido existe, proceder com exclusão
    IF v_pedido_info.id IS NOT NULL THEN
      -- Excluir vídeos relacionados primeiro (cascade)
      DELETE FROM public.pedido_videos WHERE pedido_id = v_pedido_id;
      
      -- Excluir campanhas relacionadas
      DELETE FROM public.campaigns_advanced WHERE pedido_id = v_pedido_id;
      
      -- Excluir logs de gerenciamento de vídeo
      DELETE FROM public.video_management_logs WHERE pedido_id = v_pedido_id;
      
      -- Excluir logs de bloqueio
      DELETE FROM public.pedido_blocking_logs WHERE pedido_id = v_pedido_id;
      
      -- Excluir o pedido
      DELETE FROM public.pedidos WHERE id = v_pedido_id;
      
      -- Adicionar às informações de pedidos excluídos
      v_deleted_pedidos := v_deleted_pedidos || jsonb_build_object(
        'id', v_pedido_info.id,
        'status', v_pedido_info.status,
        'valor_total', v_pedido_info.valor_total,
        'client_email', v_pedido_info.client_email,
        'created_at', v_pedido_info.created_at
      );
      
      v_deleted_count := v_deleted_count + 1;
    END IF;
  END LOOP;
  
  -- Log da operação em massa
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'BULK_DELETE_PEDIDOS',
    format('Super admin %s deleted %s orders in bulk. Justification: %s. Orders: %s. IP: %s. User-Agent: %s', 
           v_admin_id, v_deleted_count, p_justificativa, v_deleted_pedidos::text, 
           coalesce(p_ip_address, 'unknown'), coalesce(p_user_agent, 'unknown'))
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'deleted_count', v_deleted_count,
    'total_requested', array_length(p_pedido_ids, 1),
    'deleted_orders', v_deleted_pedidos,
    'justification', p_justificativa,
    'performed_by', v_admin_id,
    'timestamp', now()
  );
  
  RETURN v_result;
END;
$$;