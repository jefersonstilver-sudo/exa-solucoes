-- Corrigir nomes de grupos usando chatName do raw_payload das mensagens
-- Atualizar contact_name das conversas de grupo com o nome real do grupo

WITH group_names AS (
  SELECT DISTINCT ON (c.id)
    c.id as conversation_id,
    (m.raw_payload->>'chatName') as correct_group_name
  FROM conversations c
  INNER JOIN messages m ON m.conversation_id = c.id
  WHERE c.contact_phone LIKE '%-group'
    AND m.raw_payload->>'chatName' IS NOT NULL
    AND m.raw_payload->>'chatName' != ''
  ORDER BY c.id, m.created_at DESC
)
UPDATE conversations c
SET contact_name = gn.correct_group_name
FROM group_names gn
WHERE c.id = gn.conversation_id
  AND (c.contact_name IS NULL OR c.contact_name != gn.correct_group_name);