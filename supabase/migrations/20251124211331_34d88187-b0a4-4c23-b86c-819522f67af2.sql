-- Atualizar external_id das conversas existentes para incluir agent_key
-- Isso evita conflitos quando o mesmo telefone fala com agentes diferentes
UPDATE conversations 
SET external_id = contact_phone || '_' || agent_key 
WHERE external_id NOT LIKE '%_%';

-- Remover constraint redundante que causa conflito
-- A constraint conversations_external_id_agent_key já garante unicidade
DROP INDEX IF EXISTS idx_conversations_external_id_unique;