-- Migrar pedidos com status 'ativo' para 'video_aprovado'
-- Para manter consistência no novo fluxo de status
UPDATE public.pedidos 
SET status = 'video_aprovado'
WHERE status = 'ativo';

-- Log da migração para auditoria
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'STATUS_MIGRATION',
  format('Migrated %s orders from "ativo" to "video_aprovado" status for consistency', 
         (SELECT COUNT(*) FROM public.pedidos WHERE status = 'ativo'))
);