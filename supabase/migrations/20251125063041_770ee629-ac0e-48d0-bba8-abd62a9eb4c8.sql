-- 🤖 FASE 4: Adicionar campo sofia_paused para pausar Sofia quando Eduardo intervém
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS sofia_paused BOOLEAN DEFAULT FALSE;

-- Criar índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_conversations_sofia_paused 
ON conversations(sofia_paused) 
WHERE sofia_paused = TRUE;

-- Comentário explicativo
COMMENT ON COLUMN conversations.sofia_paused IS 'Indica se Sofia foi pausada após Eduardo assumir a conversa. Reset ao encerrar conversa.';