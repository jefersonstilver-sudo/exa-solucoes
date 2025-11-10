
-- PASSO 1: Remover TODOS os triggers e constraints que limitam múltiplos vídeos

-- Remover triggers problemáticos
DROP TRIGGER IF EXISTS trigger_ensure_single_base_video ON pedido_videos;
DROP TRIGGER IF EXISTS pv_ensure_only_one_selected_trigger ON pedido_videos;
DROP TRIGGER IF EXISTS trigger_pv_ensure_only_one_selected ON pedido_videos;

-- Remover funções problemáticas
DROP FUNCTION IF EXISTS ensure_single_base_video() CASCADE;
DROP FUNCTION IF EXISTS pv_ensure_only_one_selected() CASCADE;

-- Remover índices únicos que limitam a 1 vídeo por pedido
DROP INDEX IF EXISTS idx_pedido_videos_one_selected;
DROP INDEX IF EXISTS idx_pv_one_selected_per_order;
DROP INDEX IF EXISTS idx_pv_one_base_per_order;

-- PASSO 2: Atualizar TODOS os vídeos aprovados e ativos para serem exibidos
UPDATE pedido_videos pv
SET selected_for_display = true
FROM pedidos p
WHERE pv.pedido_id = p.id
  AND p.status IN ('ativo', 'video_aprovado', 'pago_pendente_video', 'video_enviado', 'pago')
  AND p.data_fim >= CURRENT_DATE
  AND pv.approval_status = 'approved'
  AND pv.is_active = true;

-- PASSO 3: Criar trigger simples SEM recursão para futuros vídeos
CREATE OR REPLACE FUNCTION sync_video_display_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas sincronizar status, SEM atualizar outros registros
  IF NEW.approval_status = 'approved' AND NEW.is_active = true THEN
    NEW.selected_for_display := true;
  ELSIF NEW.approval_status IN ('rejected', 'pending') OR NEW.is_active = false THEN
    NEW.selected_for_display := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_video_display_status
  BEFORE INSERT OR UPDATE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION sync_video_display_status();

COMMENT ON FUNCTION sync_video_display_status() IS 'Sincroniza automaticamente o status de exibição com aprovação e ativação, permitindo múltiplos vídeos por pedido';
