-- ============================================================================
-- MIGRATION: Add raw_payload column to messages table
-- Purpose: Store complete ManyChat webhook payload for audit and AI analysis
-- Date: 2025-11-19 22:34:00 UTC
-- Backup: messages_backup_before_raw_payload_20251119223400
-- ============================================================================

-- STEP 0: Create backup table (execute manually if needed)
-- CREATE TABLE IF NOT EXISTS messages_backup_before_raw_payload_20251119223400 AS
-- SELECT * FROM messages;

-- STEP 1: Add raw_payload column
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS raw_payload JSONB DEFAULT '{}'::jsonb;

-- STEP 2: Add documentation comment
COMMENT ON COLUMN messages.raw_payload IS 
'Payload bruto recebido do ManyChat (WhatsApp). Armazena dados integrais para auditoria, análises de IA e histórico completo. Estrutura: { "event": string, "message_id": string, "conversation_id": string, "direction": string, "from": object, "text": string, "attachments": array, "timestamp": string }';

-- STEP 3: Create index for better query performance on JSON fields
CREATE INDEX IF NOT EXISTS idx_messages_raw_payload_message_id 
ON messages ((raw_payload->>'message_id'));

CREATE INDEX IF NOT EXISTS idx_messages_raw_payload_timestamp 
ON messages ((raw_payload->>'timestamp'));

-- STEP 4: Verify column exists (for validation)
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'messages' AND column_name = 'raw_payload';