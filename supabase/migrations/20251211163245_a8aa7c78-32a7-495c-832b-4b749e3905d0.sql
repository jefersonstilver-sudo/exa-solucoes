-- CORREÇÃO 1: Limpar registros duplicados de connection_history (manter apenas o mais antigo por device)
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY computer_id, event_type
           ORDER BY started_at ASC
         ) as rn
  FROM connection_history
  WHERE event_type = 'offline' AND ended_at IS NULL
)
DELETE FROM connection_history
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- CORREÇÃO 2: Fechar registros órfãos de devices que estão online
UPDATE connection_history ch
SET 
  ended_at = NOW(), 
  duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
FROM devices d
WHERE ch.computer_id = d.id
  AND d.status = 'online'
  AND ch.event_type = 'offline'
  AND ch.ended_at IS NULL;