-- Habilitar realtime na tabela agent_knowledge para atualizações em tempo real
ALTER TABLE agent_knowledge REPLICA IDENTITY FULL;

-- Adicionar a tabela ao canal de realtime do Supabase
-- (Isso já é feito automaticamente pelo Supabase, mas garantir que está configurado)