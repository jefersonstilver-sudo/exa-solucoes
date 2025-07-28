-- Adicionar campos para rastrear aceite de termos e status de verificação de email
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Comentário sobre campo: email_verified_at será preenchido automaticamente via trigger quando user confirmado