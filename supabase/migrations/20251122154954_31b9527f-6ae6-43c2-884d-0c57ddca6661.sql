-- ============================================
-- MIGRATION: Performance Optimization Indexes
-- Objetivo: Corrigir timeout crítico em queries
-- ============================================

-- Índice para conversations.upsert (evita statement timeout)
CREATE INDEX IF NOT EXISTS idx_conversations_external_agent 
ON conversations(external_id, agent_key);

-- Índice para histórico de mensagens
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

-- Índice para deduplicação de logs Z-API
CREATE INDEX IF NOT EXISTS idx_zapi_logs_message_id 
ON zapi_logs(zapi_message_id);

-- Índice para busca de logs por telefone
CREATE INDEX IF NOT EXISTS idx_zapi_logs_phone_created 
ON zapi_logs(phone_number, created_at DESC);

-- Índice para agent_context (usado por locks atômicos)
CREATE INDEX IF NOT EXISTS idx_agent_context_key 
ON agent_context(key);

-- Índice para agent_logs por agente e timestamp
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_created 
ON agent_logs(agent_key, created_at DESC);

COMMENT ON INDEX idx_conversations_external_agent IS 'Otimiza upsert de conversações por external_id + agent_key';
COMMENT ON INDEX idx_messages_conversation_created IS 'Acelera busca de histórico de mensagens';
COMMENT ON INDEX idx_zapi_logs_message_id IS 'Deduplicação rápida por zapi_message_id';
COMMENT ON INDEX idx_agent_context_key IS 'Locks atômicos performáticos';