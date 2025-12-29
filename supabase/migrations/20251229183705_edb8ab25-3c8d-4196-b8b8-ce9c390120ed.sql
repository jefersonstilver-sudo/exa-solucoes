-- Adicionar campos de 2FA no login para master na tabela configuracoes_adicionais
ALTER TABLE configuracoes_adicionais 
ADD COLUMN IF NOT EXISTS login_2fa_master_ativo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS login_2fa_telefone_master TEXT;

-- Adicionar campos para controle de sessões ativas na tabela user_sessions
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terminated_by UUID;

-- Criar índice para buscar sessões ativas rapidamente
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active) WHERE is_active = true;

-- Comentários para documentação
COMMENT ON COLUMN configuracoes_adicionais.login_2fa_master_ativo IS 'Quando ativo, exige código 2FA via WhatsApp para login do master';
COMMENT ON COLUMN configuracoes_adicionais.login_2fa_telefone_master IS 'Telefone do master para receber código 2FA via WhatsApp';
COMMENT ON COLUMN user_sessions.is_active IS 'Indica se a sessão está ativa ou foi encerrada';
COMMENT ON COLUMN user_sessions.terminated_at IS 'Data/hora em que a sessão foi encerrada';
COMMENT ON COLUMN user_sessions.terminated_by IS 'UUID do usuário que encerrou a sessão';