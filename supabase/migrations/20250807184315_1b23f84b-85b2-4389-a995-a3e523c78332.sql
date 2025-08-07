-- Corrigir vídeos aprovados que ainda não estão ativos
-- Esta migração corrige vídeos que foram aprovados antes da correção da função approve_video

-- Atualizar vídeos aprovados para ficarem ativos
UPDATE public.pedido_videos 
SET 
  is_active = true,
  updated_at = now()
WHERE approval_status = 'approved' 
AND is_active = false;

-- Para vídeos aprovados em campanhas simples (não avançadas), garantir que estejam selecionados para exibição
UPDATE public.pedido_videos 
SET 
  selected_for_display = true,
  updated_at = now()
WHERE approval_status = 'approved' 
AND is_active = true
AND NOT EXISTS (
  SELECT 1 FROM public.campaigns_advanced ca 
  WHERE ca.pedido_id = pedido_videos.pedido_id
)
AND selected_for_display = false;

-- Log da correção
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'VIDEO_ACTIVATION_FIX',
  'Correção aplicada: vídeos aprovados anteriormente foram ativados automaticamente'
);