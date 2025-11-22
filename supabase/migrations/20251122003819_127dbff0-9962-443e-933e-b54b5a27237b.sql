-- Step 1: Remove duplicate zapi_message_id entries, keeping only the oldest
-- This cleans up existing duplicates before adding the UNIQUE constraint

DELETE FROM zapi_logs
WHERE id IN (
  SELECT id 
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY zapi_message_id 
        ORDER BY created_at ASC
      ) as row_num
    FROM zapi_logs
    WHERE zapi_message_id IS NOT NULL
  ) t
  WHERE row_num > 1
);

-- Step 2: Add UNIQUE INDEX to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS zapi_logs_message_id_unique 
ON zapi_logs(zapi_message_id) 
WHERE zapi_message_id IS NOT NULL;