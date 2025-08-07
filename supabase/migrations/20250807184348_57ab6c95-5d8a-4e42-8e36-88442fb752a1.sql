-- Corrigir vídeos aprovados que ainda não estão ativos
-- Esta migração corrige vídeos que foram aprovados antes da correção da função approve_video
-- Considerando a constraint que permite apenas um vídeo ativo por pedido

-- Primeiro, identificar qual vídeo deve ser ativo para cada pedido (o mais recentemente aprovado)
WITH ranked_videos AS (
  SELECT 
    id,
    pedido_id,
    ROW_NUMBER() OVER (PARTITION BY pedido_id ORDER BY approved_at DESC, created_at DESC) as rn
  FROM public.pedido_videos 
  WHERE approval_status = 'approved'
),
videos_to_activate AS (
  SELECT pv.id
  FROM public.pedido_videos pv
  JOIN ranked_videos rv ON pv.id = rv.id AND rv.rn = 1
  WHERE pv.approval_status = 'approved' 
  AND pv.is_active = false
)
-- Atualizar apenas o vídeo mais recente aprovado de cada pedido
UPDATE public.pedido_videos 
SET 
  is_active = true,
  selected_for_display = true,
  updated_at = now()
WHERE id IN (SELECT id FROM videos_to_activate);

-- Log da correção
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'VIDEO_ACTIVATION_FIX',
  'Correção aplicada: vídeos aprovados mais recentes foram ativados automaticamente respeitando constraint única'
);