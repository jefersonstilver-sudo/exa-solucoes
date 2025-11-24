-- Limpar conversas duplicadas mantendo apenas a mais recente
-- Deletar conversa antiga duplicada para 554598090000
DELETE FROM conversations
WHERE id = '89a1587b-610f-4e8f-b587-afd34f4667b6';

-- Corrigir is_group para false (não é grupo real, é conversa individual)
-- E atualizar nome correto baseado no senderName
UPDATE conversations
SET 
  is_group = false,
  contact_name = 'Jeferson Stilver Encina'
WHERE id = '30204094-4386-4cc0-bbb1-c9cadab7ae5c';

-- Garantir que external_id seja único para evitar futuros duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_external_id_unique 
ON conversations(external_id);