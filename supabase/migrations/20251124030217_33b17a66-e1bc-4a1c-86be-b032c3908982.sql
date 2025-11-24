-- Ativar realtime para a tabela devices
ALTER TABLE devices REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
