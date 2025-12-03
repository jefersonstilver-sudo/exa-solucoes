-- Adicionar coluna client_name na tabela pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Atualizar pedidos existentes com nome do cliente da proposta (quando disponível)
UPDATE pedidos p
SET client_name = pr.client_name
FROM proposals pr
WHERE p.proposal_id = pr.id 
AND p.client_name IS NULL
AND pr.client_name IS NOT NULL;

-- Criar índice para buscas por client_name
CREATE INDEX IF NOT EXISTS idx_pedidos_client_name ON pedidos(client_name);