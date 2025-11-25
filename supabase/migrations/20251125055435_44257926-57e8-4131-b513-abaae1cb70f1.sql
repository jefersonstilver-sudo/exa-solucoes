-- Adicionar coluna display_order para ordenação oficial dos knowledge items
ALTER TABLE agent_knowledge_items 
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Criar índice para melhorar performance de ordenação
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_items_display_order 
ON agent_knowledge_items(agent_id, display_order) 
WHERE active = true;