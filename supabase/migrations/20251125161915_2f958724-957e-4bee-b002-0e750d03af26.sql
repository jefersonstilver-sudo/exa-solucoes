-- Adicionar campo is_muted na tabela conversations
ALTER TABLE conversations 
ADD COLUMN is_muted boolean DEFAULT false;

-- Criar índice para melhor performance
CREATE INDEX idx_conversations_muted ON conversations(is_muted) WHERE is_muted = true;

-- Comentário
COMMENT ON COLUMN conversations.is_muted IS 'Indica se as notificações desta conversa estão silenciadas';