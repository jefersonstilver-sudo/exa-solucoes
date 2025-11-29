-- Adicionar coluna user_id na tabela de códigos de verificação existente
ALTER TABLE exa_alerts_verification_codes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Adicionar tipo de verificação (phone_change, 2fa_login, new_phone, signup)
ALTER TABLE exa_alerts_verification_codes 
ADD COLUMN IF NOT EXISTS tipo_verificacao TEXT DEFAULT 'phone_change';

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id 
ON exa_alerts_verification_codes(user_id);

CREATE INDEX IF NOT EXISTS idx_verification_codes_tipo 
ON exa_alerts_verification_codes(tipo_verificacao);

-- Adicionar colunas de 2FA e verificação na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS telefone_verificado BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS telefone_verificado_at TIMESTAMPTZ;

-- Adicionar índice para melhorar performance de queries de 2FA
CREATE INDEX IF NOT EXISTS idx_users_two_factor 
ON users(two_factor_enabled) WHERE two_factor_enabled = true;