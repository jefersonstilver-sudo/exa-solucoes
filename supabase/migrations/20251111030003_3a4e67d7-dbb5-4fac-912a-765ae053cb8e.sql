-- ============================================================================
-- CORREÇÃO: Permitir desativação temporária do vídeo base para dar prioridade aos agendamentos
-- ============================================================================
-- Problema: O trigger protect_base_video_from_deactivation estava impedindo que o vídeo base
-- fosse desativado temporariamente quando há um vídeo agendado ativo, causando a exibição
-- simultânea de dois vídeos (base + agendado).
--
-- Solução: Modificar o trigger para permitir desativação automática pelo sistema de agendamento

-- 1️⃣ REMOVER O TRIGGER RESTRITIVO ANTIGO
DROP TRIGGER IF EXISTS trigger_protect_base_video ON pedido_videos;
DROP FUNCTION IF EXISTS protect_base_video_from_deactivation();

-- 2️⃣ CRIAR NOVA FUNÇÃO DE PROTEÇÃO MAIS INTELIGENTE
-- Esta função permite desativação temporária, mas protege contra remoção acidental do flag is_base_video
CREATE OR REPLACE FUNCTION protect_base_video_smart()
RETURNS TRIGGER AS $$
BEGIN
  -- Proteger contra remoção acidental do flag is_base_video
  -- PERMITIR desativação temporária de is_active (necessário para agendamentos)
  IF OLD.is_base_video = true AND NEW.is_base_video = false THEN
    -- Verificar se há outros vídeos aprovados no mesmo pedido antes de permitir
    IF NOT EXISTS (
      SELECT 1 FROM pedido_videos
      WHERE pedido_id = NEW.pedido_id
        AND id != NEW.id
        AND approval_status = 'approved'
        AND is_base_video = false
    ) THEN
      RAISE EXCEPTION 'Não é possível remover is_base_video do único vídeo aprovado. Adicione outro vídeo primeiro.';
    END IF;
    
    RAISE NOTICE 'Flag is_base_video removido do vídeo % (pedido %)', NEW.video_id, NEW.pedido_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3️⃣ APLICAR NOVO TRIGGER
CREATE TRIGGER trigger_protect_base_video_smart
  BEFORE UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION protect_base_video_smart();

-- 4️⃣ GARANTIR QUE A FUNÇÃO DE REATIVAÇÃO FUNCIONE CORRETAMENTE
-- Recriar a função para garantir que está atualizada
CREATE OR REPLACE FUNCTION reactivate_base_video_when_no_scheduled()
RETURNS TRIGGER AS $$
DECLARE
  v_pedido_id uuid;
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
        
      RAISE NOTICE '✅ Vídeo base reativado automaticamente para pedido % (nenhum agendado ativo)', v_pedido_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5️⃣ GARANTIR QUE O TRIGGER DE REATIVAÇÃO ESTEJA ATIVO
DROP TRIGGER IF EXISTS trigger_reactivate_base_video ON pedido_videos;
CREATE TRIGGER trigger_reactivate_base_video
  AFTER UPDATE ON pedido_videos
  FOR EACH ROW
  WHEN (OLD.is_active = true AND NEW.is_active = false)
  EXECUTE FUNCTION reactivate_base_video_when_no_scheduled();

-- 6️⃣ EXECUTAR A EDGE FUNCTION MANUALMENTE PARA CORRIGIR O ESTADO ATUAL
-- (A Edge Function video-status-updater já está configurada para executar a cada minuto via cron)

COMMENT ON FUNCTION protect_base_video_smart IS 
'Protege o flag is_base_video de ser removido acidentalmente, mas PERMITE desativação temporária de is_active para dar prioridade aos vídeos agendados';

COMMENT ON FUNCTION reactivate_base_video_when_no_scheduled IS 
'Reativa automaticamente o vídeo base quando não há mais vídeos agendados ativos no pedido';