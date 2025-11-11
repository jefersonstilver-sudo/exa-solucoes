-- Adicionar verificação de contexto RPC nas funções de proteção
-- Isso permite que o RPC set_base_video_enhanced execute a troca de vídeo principal
-- sem ser bloqueado pelos triggers de proteção

-- 1. Modificar protect_base_video_flag para permitir operações via RPC
CREATE OR REPLACE FUNCTION protect_base_video_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permitir bypass quando chamado via RPC controlado
  IF current_setting('app.in_rpc_context', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Prevenir remoção da flag is_base_video de TRUE para FALSE em operações diretas
  IF OLD.is_base_video = TRUE AND NEW.is_base_video = FALSE THEN
    RAISE EXCEPTION 'Cannot remove base video flag directly. Use set_base_video_enhanced RPC.';
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Modificar protect_base_video_smart para permitir operações via RPC
CREATE OR REPLACE FUNCTION protect_base_video_smart()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_base_count INT;
  v_pedido_id UUID;
BEGIN
  -- Permitir bypass quando chamado via RPC controlado
  IF current_setting('app.in_rpc_context', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Obter pedido_id do registro
  SELECT pedido_id INTO v_pedido_id FROM pedido_videos WHERE id = NEW.id;
  
  -- Contar quantos vídeos base existem atualmente para este pedido
  SELECT COUNT(*) INTO v_current_base_count
  FROM pedido_videos
  WHERE pedido_id = v_pedido_id 
    AND is_base_video = TRUE
    AND id != NEW.id;

  -- Se estamos tentando marcar como base e já existe outro
  IF NEW.is_base_video = TRUE AND v_current_base_count > 0 THEN
    RAISE EXCEPTION 'Only one base video allowed per order. Use set_base_video_enhanced RPC to change.';
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Modificar protect_last_principal_video para permitir operações via RPC
CREATE OR REPLACE FUNCTION protect_last_principal_video()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id UUID;
  v_total_approved INT;
BEGIN
  -- Permitir bypass quando chamado via RPC controlado
  IF current_setting('app.in_rpc_context', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Obter pedido_id
  SELECT pedido_id INTO v_pedido_id FROM pedido_videos WHERE id = OLD.id;
  
  -- Contar total de vídeos aprovados
  SELECT COUNT(*) INTO v_total_approved
  FROM pedido_videos
  WHERE pedido_id = v_pedido_id 
    AND approval_status = 'approved';

  -- Se este é o último vídeo aprovado e está sendo marcado como base, prevenir remoção
  IF v_total_approved = 1 AND OLD.is_base_video = TRUE AND NEW.is_base_video = FALSE THEN
    RAISE EXCEPTION 'Cannot remove base flag from the last approved video. Upload another video first.';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION protect_base_video_flag() IS 'Protege contra remoção direta da flag is_base_video, mas permite operações via RPC set_base_video_enhanced quando app.in_rpc_context está definido';
COMMENT ON FUNCTION protect_base_video_smart() IS 'Previne múltiplos vídeos base por pedido em operações diretas, mas permite via RPC set_base_video_enhanced';
COMMENT ON FUNCTION protect_last_principal_video() IS 'Protege o último vídeo aprovado de perder status de principal em operações diretas, mas permite via RPC set_base_video_enhanced';