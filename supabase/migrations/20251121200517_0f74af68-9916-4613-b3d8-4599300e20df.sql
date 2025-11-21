-- Limpar todas as referências ao ManyChat
-- Remover colunas do ManyChat da tabela agents
ALTER TABLE agents DROP COLUMN IF EXISTS manychat_config;
ALTER TABLE agents DROP COLUMN IF EXISTS manychat_connected;

-- Atualizar conversas que usam ManyChat para usar Z-API
UPDATE conversations 
SET provider = 'zapi' 
WHERE provider = 'manychat';

-- Adicionar comentário explicativo
COMMENT ON TABLE agents IS 'Tabela de agentes - ManyChat removido, apenas Z-API suportado';