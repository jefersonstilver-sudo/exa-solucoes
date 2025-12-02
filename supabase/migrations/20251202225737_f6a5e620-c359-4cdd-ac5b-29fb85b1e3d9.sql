-- Remover mensagens duplicadas, mantendo apenas a mais antiga de cada grupo
-- Fase 1: Identificar e deletar duplicatas

WITH duplicates_to_keep AS (
  SELECT DISTINCT ON (conversation_id, body) 
    id
  FROM messages
  ORDER BY conversation_id, body, created_at ASC, external_message_id NULLS LAST
),
duplicates_to_delete AS (
  SELECT m.id
  FROM messages m
  WHERE m.id NOT IN (SELECT id FROM duplicates_to_keep)
)
DELETE FROM messages 
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Criar índice único para prevenir duplicatas futuras
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_unique_content 
ON messages (conversation_id, body, created_at)
WHERE body IS NOT NULL;