-- SOLUÇÃO DEFINITIVA: Remover constraint que impede ativação de vídeos agendados
-- A RPC `activate_scheduled_video` já garante que apenas um vídeo esteja ativo por vez

-- Remover a constraint problemática
DROP INDEX IF EXISTS idx_one_selected_per_pedido;
DROP INDEX IF EXISTS ux_pedido_videos_one_selected;
DROP INDEX IF EXISTS idx_pedido_videos_one_selected;

-- Manter apenas a constraint para is_base_video (um único vídeo principal por pedido)
-- Esta já existe: idx_one_base_per_pedido

-- Comentário explicativo
COMMENT ON INDEX idx_one_base_per_pedido IS 
'Garante que cada pedido tenha exatamente UM vídeo marcado como principal (is_base_video=true). A flag selected_for_display é gerenciada dinamicamente pelo sistema de agendamento e não precisa de constraint.';