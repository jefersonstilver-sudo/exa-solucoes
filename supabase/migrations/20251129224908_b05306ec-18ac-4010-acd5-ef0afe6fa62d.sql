-- Permitir verificação sem user_id (para signup antes da criação da conta)
ALTER TABLE exa_alerts_verification_codes 
ALTER COLUMN user_id DROP NOT NULL;

-- Adicionar session_id para rastrear verificações de signup sem user_id
ALTER TABLE exa_alerts_verification_codes 
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Index para busca por telefone + session_id
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone_session 
ON exa_alerts_verification_codes(telefone, session_id) 
WHERE session_id IS NOT NULL;

-- Index para busca por telefone + user_id (melhoria de performance)
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone_user 
ON exa_alerts_verification_codes(telefone, user_id) 
WHERE user_id IS NOT NULL;