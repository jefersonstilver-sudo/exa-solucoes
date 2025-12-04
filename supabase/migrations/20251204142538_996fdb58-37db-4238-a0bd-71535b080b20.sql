-- Adicionar campo empresa_endereco na tabela users para armazenar endereço completo da empresa
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS empresa_endereco TEXT;

-- Comentário explicativo
COMMENT ON COLUMN public.users.empresa_endereco IS 'Endereço completo da empresa do usuário';