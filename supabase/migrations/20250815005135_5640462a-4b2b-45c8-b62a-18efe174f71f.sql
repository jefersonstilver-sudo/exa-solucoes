-- Desabilitar trigger de prevenção de tentativas órfãs
-- Remove o trigger da tabela tentativas_compra para permitir tentativas duplicadas

DROP TRIGGER IF EXISTS prevent_orphaned_attempts_trigger ON public.tentativas_compra;

-- Log da desabilitação para auditoria
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'TRIGGER_DISABLED',
  'Trigger prevent_orphaned_attempts_trigger desabilitado para resolver problemas no N8N'
);