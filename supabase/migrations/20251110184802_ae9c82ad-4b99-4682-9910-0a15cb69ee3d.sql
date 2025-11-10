-- Atualizar trigger prevent_last_video_removal para permitir super admin
CREATE OR REPLACE FUNCTION public.prevent_last_video_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining_active_videos integer;
  v_contract_started boolean;
  v_pedido_status text;
  v_is_super_admin boolean;
BEGIN
  -- Verificar se é uma remoção (DELETE)
  IF TG_OP = 'DELETE' THEN
    -- Verificar se o usuário atual é super admin
    v_is_super_admin := public.is_current_user_super_admin();
    
    -- Se é super admin, permitir qualquer deleção sem validações
    IF v_is_super_admin THEN
      RETURN OLD;
    END IF;
    
    -- Para não-super-admins, aplicar as validações normais
    -- Verificar se o contrato já foi iniciado
    SELECT 
      data_inicio IS NOT NULL AND data_inicio <= CURRENT_DATE,
      status
    INTO v_contract_started, v_pedido_status
    FROM public.pedidos 
    WHERE id = OLD.pedido_id;
    
    -- Se contrato ainda não iniciou, permitir remoção
    IF NOT v_contract_started THEN
      RETURN OLD;
    END IF;
    
    -- Contar quantos vídeos ativos restam (excluindo o que está sendo removido)
    SELECT COUNT(*) INTO v_remaining_active_videos
    FROM public.pedido_videos 
    WHERE pedido_id = OLD.pedido_id 
    AND id != OLD.id
    AND approval_status = 'approved'
    AND is_active = true;
    
    -- Se não restariam vídeos ativos, bloquear remoção
    IF v_remaining_active_videos = 0 THEN
      RAISE EXCEPTION 'CANNOT_REMOVE_LAST_VIDEO: Cannot remove the last active video from an active contract. Upload another video first.';
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Atualizar trigger prevent_base_video_removal para permitir super admin
CREATE OR REPLACE FUNCTION public.prevent_base_video_removal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining_approved_videos integer;
  v_contract_started boolean;
  v_is_base_video boolean;
  v_is_super_admin boolean;
BEGIN
  -- Verificar se é uma remoção (DELETE)
  IF TG_OP = 'DELETE' THEN
    -- Verificar se o usuário atual é super admin
    v_is_super_admin := public.is_current_user_super_admin();
    
    -- Se é super admin, permitir qualquer deleção sem validações
    IF v_is_super_admin THEN
      RETURN OLD;
    END IF;
    
    -- Para não-super-admins, aplicar as validações normais
    -- Verificar se é vídeo base
    v_is_base_video := OLD.is_base_video;
    
    -- Verificar se o contrato já foi iniciado
    SELECT 
      data_inicio IS NOT NULL AND data_inicio <= CURRENT_DATE
    INTO v_contract_started
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