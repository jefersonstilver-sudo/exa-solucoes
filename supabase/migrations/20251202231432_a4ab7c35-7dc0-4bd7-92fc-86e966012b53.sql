-- Remover mensagens duplicadas existentes (manter apenas a mais antiga)
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY conversation_id, body, DATE_TRUNC('second', created_at)
      ORDER BY created_at ASC
    ) as rn
  FROM messages
)
DELETE FROM messages
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Adicionar coluna de auditoria para conversas
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS audit_outbound_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS audit_inbound_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS audit_last_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS audit_sync_issue BOOLEAN DEFAULT FALSE;

-- Criar função para atualizar contagens de auditoria
CREATE OR REPLACE FUNCTION update_conversation_audit_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar contagens na conversa
  UPDATE conversations 
  SET 
    audit_outbound_count = (
      SELECT COUNT(*) FROM messages 
      WHERE conversation_id = COALESCE(NEW.conversation_id, OLD.conversation_id) 
      AND direction = 'outbound'
    ),
    audit_inbound_count = (
      SELECT COUNT(*) FROM messages 
      WHERE conversation_id = COALESCE(NEW.conversation_id, OLD.conversation_id) 
      AND direction = 'inbound'
    ),
    audit_last_check = NOW(),
    audit_sync_issue = (
      SELECT COUNT(*) FROM messages 
      WHERE conversation_id = COALESCE(NEW.conversation_id, OLD.conversation_id) 
      AND direction = 'outbound'
    ) = 0 AND (
      SELECT COUNT(*) FROM messages 
      WHERE conversation_id = COALESCE(NEW.conversation_id, OLD.conversation_id) 
      AND direction = 'inbound'
    ) > 3
  WHERE id = COALESCE(NEW.conversation_id, OLD.conversation_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar auditoria automaticamente
DROP TRIGGER IF EXISTS trigger_update_conversation_audit ON messages;
CREATE TRIGGER trigger_update_conversation_audit
AFTER INSERT OR UPDATE OR DELETE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_audit_counts();

-- Atualizar todas as conversas existentes com contagens de auditoria
UPDATE conversations c
SET 
  audit_outbound_count = (
    SELECT COUNT(*) FROM messages m 
    WHERE m.conversation_id = c.id AND m.direction = 'outbound'
  ),
  audit_inbound_count = (
    SELECT COUNT(*) FROM messages m 
    WHERE m.conversation_id = c.id AND m.direction = 'inbound'
  ),
  audit_last_check = NOW(),
  audit_sync_issue = (
    SELECT COUNT(*) FROM messages m 
    WHERE m.conversation_id = c.id AND m.direction = 'outbound'
  ) = 0 AND (
    SELECT COUNT(*) FROM messages m 
    WHERE m.conversation_id = c.id AND m.direction = 'inbound'
  ) > 3;

-- Criar índice para buscar conversas com problemas
CREATE INDEX IF NOT EXISTS idx_conversations_sync_issue ON conversations(audit_sync_issue) WHERE audit_sync_issue = true;