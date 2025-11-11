
-- ============================================================================
-- CORREÇÃO DEFINITIVA: VÍDEO PRINCIPAL NUNCA PODE PERDER A MARCAÇÃO
-- ============================================================================

-- 1️⃣ CORRIGIR O PEDIDO PROBLEMÁTICO
UPDATE pedido_videos
SET 
  is_base_video = true,
  is_active = true,
  selected_for_display = true,
  updated_at = now()
WHERE pedido_id = 'c0214207-dae2-494e-89e4-36aa6a97ee4f'
  AND slot_position = 1
  AND video_id = '3c130bfa-19ff-4773-a0f4-29f9ad73fd9e';

-- 2️⃣ GARANTIR QUE O VÍDEO AGENDADO NÃO SEJA BASE
UPDATE pedido_videos
SET 
  is_base_video = false,
  updated_at = now()
WHERE pedido_id = 'c0214207-dae2-494e-89e4-36aa6a97ee4f'
  AND slot_position = 2
  AND video_id = '64320efa-92ec-4e9e-89d2-8fe211b2ff8c';

-- 3️⃣ CRIAR FUNÇÃO QUE PROTEGE O VÍDEO BASE DE SER DESATIVADO
CREATE OR REPLACE FUNCTION protect_base_video_from_deactivation()
RETURNS TRIGGER AS $$
BEGIN
  -- Se estiver tentando desativar um vídeo base, bloquear
  IF OLD.is_base_video = true AND NEW.is_base_video = true THEN
    IF NEW.is_active = false OR NEW.selected_for_display = false THEN
      RAISE EXCEPTION 'CRÍTICO: Vídeo base não pode ser desativado! Use is_base_video=false antes.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4️⃣ CRIAR TRIGGER PARA PROTEGER VÍDEO BASE
DROP TRIGGER IF EXISTS trigger_protect_base_video ON pedido_videos;
CREATE TRIGGER trigger_protect_base_video
  BEFORE UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION protect_base_video_from_deactivation();

-- 5️⃣ CRIAR FUNÇÃO PARA REATIVAR VÍDEO BASE QUANDO NÃO HÁ AGENDADOS ATIVOS
CREATE OR REPLACE FUNCTION reactivate_base_video_when_no_scheduled()
RETURNS TRIGGER AS $$
DECLARE
  v_pedido_id uuid;
  v_base_video_id uuid;
  v_has_active_scheduled boolean;
BEGIN
  -- Pegar o pedido_id
  v_pedido_id := NEW.pedido_id;
  
  -- Se o vídeo que foi desativado era agendado (não base)
  IF NEW.is_active = false AND NEW.is_base_video = false THEN
    
    -- Verificar se existe algum vídeo agendado ativo neste pedido
    SELECT EXISTS(
      SELECT 1 FROM pedido_videos
      WHERE pedido_id = v_pedido_id
        AND is_base_video = false
        AND is_active = true
        AND approval_status = 'approved'
    ) INTO v_has_active_scheduled;
    
    -- Se não há vídeos agendados ativos, reativar o vídeo base
    IF NOT v_has_active_scheduled THEN
      UPDATE pedido_videos
      SET 
        is_active = true,
        selected_for_display = true,
        updated_at = now()
      WHERE pedido_id = v_pedido_id
        AND is_base_video = true
        AND approval_status = 'approved';
        
      RAISE NOTICE 'Vídeo base reativado para pedido % (nenhum agendado ativo)', v_pedido_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6️⃣ CRIAR TRIGGER PARA REATIVAR VÍDEO BASE
DROP TRIGGER IF EXISTS trigger_reactivate_base_video ON pedido_videos;
CREATE TRIGGER trigger_reactivate_base_video
  AFTER UPDATE ON pedido_videos
  FOR EACH ROW
  WHEN (OLD.is_active = true AND NEW.is_active = false)
  EXECUTE FUNCTION reactivate_base_video_when_no_scheduled();
