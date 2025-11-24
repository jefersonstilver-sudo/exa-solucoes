-- Adicionar campo is_group na tabela conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS is_group boolean DEFAULT false;

COMMENT ON COLUMN conversations.is_group IS 'Indica se a conversa é um grupo do WhatsApp';

-- Criar índice para queries por tipo de conversa
CREATE INDEX IF NOT EXISTS idx_conversations_is_group ON conversations(is_group) WHERE is_group = true;

-- Corrigir os 2 grupos existentes com os nomes corretos
-- Grupo 1: Equipe Indexa
UPDATE conversations 
SET 
  contact_name = 'Equipe Indexa',
  is_group = true
WHERE contact_phone = '554598090000' 
  AND agent_key = 'sofia';

-- Grupo 2: TESTE INDEXA
UPDATE conversations 
SET 
  contact_name = 'TESTE INDEXA',
  is_group = true
WHERE contact_phone = '5545999748825' 
  AND agent_key = 'sofia';