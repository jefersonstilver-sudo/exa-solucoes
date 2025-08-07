-- Primeiro, remover a constraint que impede múltiplos vídeos ativos por pedido
-- Esta constraint estava causando problemas para campanhas avançadas
ALTER TABLE public.pedido_videos 
DROP CONSTRAINT IF EXISTS unique_active_video_per_pedido;

-- Agora ativar TODOS os vídeos aprovados que estão inativos
UPDATE public.pedido_videos 
SET 
  is_active = true,
  selected_for_display = true,
  updated_at = now()
WHERE approval_status = 'approved' 
AND is_active = false;

-- Log da correção
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'CONSTRAINT_REMOVED_AND_VIDEOS_ACTIVATED',
  'Constraint unique_active_video_per_pedido removida e todos os vídeos aprovados ativados para suportar campanhas avançadas'
);