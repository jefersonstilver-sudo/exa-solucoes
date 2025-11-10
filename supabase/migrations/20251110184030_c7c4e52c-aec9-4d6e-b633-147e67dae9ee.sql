-- Criar tabela de histórico de deleções de pedidos
CREATE TABLE IF NOT EXISTS public.pedidos_deletion_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL,
  pedido_data JSONB NOT NULL,
  deleted_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  justification TEXT,
  ip_address TEXT,
  user_agent TEXT,
  videos_deleted JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Habilitar RLS
ALTER TABLE public.pedidos_deletion_history ENABLE ROW LEVEL SECURITY;

-- Policies para histórico de deleções
CREATE POLICY "Super admins can view deletion history"
ON public.pedidos_deletion_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

CREATE POLICY "System can insert deletion history"
ON public.pedidos_deletion_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Criar índices para performance
CREATE INDEX idx_pedidos_deletion_history_deleted_at ON public.pedidos_deletion_history(deleted_at DESC);
CREATE INDEX idx_pedidos_deletion_history_deleted_by ON public.pedidos_deletion_history(deleted_by);

-- Função helper para verificar se usuário atual é super admin
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  );
END;
$$;

-- Atualizar o trigger para permitir que super admins deletem o último vídeo
CREATE OR REPLACE FUNCTION public.prevent_last_video_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining_approved_videos INTEGER;
  v_is_base_video BOOLEAN;
  v_contract_started BOOLEAN;
  v_is_super_admin BOOLEAN;
BEGIN
  -- Se está inserindo ou atualizando, não fazer nada
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    RETURN NEW;
  END IF;
  
  -- Se está deletando
  IF TG_OP = 'DELETE' THEN
    -- Verificar se o usuário atual é super admin
    v_is_super_admin := public.is_current_user_super_admin();
    
    -- Se é super admin, permitir qualquer deleção sem validações
    IF v_is_super_admin THEN
      RETURN OLD;
    END IF;
    
    -- Para não-super-admins, aplicar as validações normais
    v_is_base_video := OLD.is_base_video;
    
    -- Verificar se o contrato já iniciou
    SELECT (data_inicio <= CURRENT_DATE) INTO v_contract_started
    FROM public.pedidos 
    WHERE id = OLD.pedido_id;
    
    -- Se contrato ainda não iniciou, permitir remoção
    IF NOT v_contract_started THEN
      RETURN OLD;
    END IF;
    
    -- Contar quantos vídeos aprovados restam (excluindo o que está sendo removido)
    SELECT COUNT(*) INTO v_remaining_approved_videos
    FROM public.pedido_videos 
    WHERE pedido_id = OLD.pedido_id 
    AND id != OLD.id
    AND approval_status = 'approved';
    
    -- Se é o último vídeo aprovado, bloquear remoção
    IF v_remaining_approved_videos = 0 THEN
      RAISE EXCEPTION 'CANNOT_REMOVE_LAST_VIDEO: Cannot remove the last approved video from an active contract. Upload another video first.';
    END IF;
    
    -- Se é vídeo base e há outros vídeos aprovados, usuário deve definir novo base primeiro
    IF v_is_base_video AND v_remaining_approved_videos > 0 THEN
      RAISE EXCEPTION 'CANNOT_REMOVE_BASE_VIDEO: Cannot remove base video. Please set another video as base first.';
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Função RPC para deleção completa de pedidos (apenas super admins)
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
BEGIN
  -- Verificar se o usuário é super admin
  IF NOT public.is_current_user_super_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas super admins podem deletar pedidos completamente'
    );
  END IF;
  
  v_deleted_by := auth.uid();
  
  -- Capturar dados do pedido antes de deletar
  SELECT row_to_json(p.*) INTO v_pedido_data
  FROM public.pedidos p
  WHERE p.id = p_pedido_id;
  
  IF v_pedido_data IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pedido não encontrado'
    );
  END IF;
  
  -- Capturar dados dos vídeos antes de deletar
  SELECT jsonb_agg(row_to_json(pv.*)) INTO v_videos_data
  FROM public.pedido_videos pv
  WHERE pv.pedido_id = p_pedido_id;
  
  -- Salvar histórico ANTES de deletar
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
  
  -- Deletar vídeos associados primeiro
  DELETE FROM public.pedido_videos WHERE pedido_id = p_pedido_id;
  
  -- Deletar o pedido
  DELETE FROM public.pedidos WHERE id = p_pedido_id;
  
  -- Log do evento
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
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_pedido_id', p_pedido_id,
    'videos_deleted', jsonb_array_length(COALESCE(v_videos_data, '[]'::jsonb))
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Função RPC para deleção em massa completa de pedidos (apenas super admins)
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
BEGIN
  -- Verificar se o usuário é super admin
  IF NOT public.is_current_user_super_admin() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas super admins podem deletar pedidos em massa',
      'deleted_count', 0,
      'total_requested', array_length(p_pedido_ids, 1)
    );
  END IF;
  
  v_total_requested := array_length(p_pedido_ids, 1);
  
  -- Deletar cada pedido
  FOREACH v_pedido_id IN ARRAY p_pedido_ids
  LOOP
    BEGIN
      v_result := public.super_admin_delete_pedido_complete(
        v_pedido_id,
        p_justification,
        p_ip_address,
        p_user_agent
      );
      
      IF (v_result->>'success')::boolean THEN
        v_deleted_count := v_deleted_count + 1;
      ELSE
        v_errors := array_append(v_errors, format('Pedido %s: %s', v_pedido_id, v_result->>'error'));
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := array_append(v_errors, format('Pedido %s: %s', v_pedido_id, SQLERRM));
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', v_deleted_count > 0,
    'deleted_count', v_deleted_count,
    'total_requested', v_total_requested,
    'errors', array_to_json(v_errors)
  );
END;
$$;