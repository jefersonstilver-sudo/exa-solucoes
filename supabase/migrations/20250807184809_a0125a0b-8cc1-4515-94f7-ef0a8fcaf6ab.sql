-- Ativar TODOS os vídeos aprovados que estão inativos
-- Correção: vídeos aprovados devem sempre estar ativos
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
  'APPROVED_VIDEOS_ACTIVATION_FIX',
  'Correção aplicada: TODOS os vídeos aprovados foram ativados - regra incorreta de um-video-por-pedido removida'
);