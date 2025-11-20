-- FASE 2: Habilitar Realtime nas tabelas do CRM
-- Configurar REPLICA IDENTITY para capturar mudanças completas
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- FASE 5: Adicionar campo de resposta automática IA
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS ai_auto_response boolean DEFAULT false;

-- Comentários explicativos
COMMENT ON COLUMN public.agents.ai_auto_response IS 'Quando ativo, o agente responde automaticamente usando IA treinada';