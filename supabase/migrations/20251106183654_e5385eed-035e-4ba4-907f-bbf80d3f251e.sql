-- Migration: add_company_brand_fields_to_users
-- Description: Adiciona campos de empresa/marca na tabela users para separar cadastro pessoal de cadastro empresarial

-- Adicionar colunas de empresa/marca
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS empresa_nome TEXT,
ADD COLUMN IF NOT EXISTS empresa_pais TEXT CHECK (empresa_pais IN ('BR', 'AR', 'PY')),
ADD COLUMN IF NOT EXISTS empresa_documento TEXT,
ADD COLUMN IF NOT EXISTS empresa_segmento TEXT,
ADD COLUMN IF NOT EXISTS empresa_aceite_termo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS empresa_aceite_data TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação
COMMENT ON COLUMN users.empresa_nome IS 'Nome da empresa ou marca que o usuário representa';
COMMENT ON COLUMN users.empresa_pais IS 'País da empresa: BR (Brasil - CNPJ), AR (Argentina - CUIT), PY (Paraguai - RUC)';
COMMENT ON COLUMN users.empresa_documento IS 'CNPJ (Brasil), CUIT (Argentina) ou RUC (Paraguai)';
COMMENT ON COLUMN users.empresa_segmento IS 'Segmento de negócio da empresa';
COMMENT ON COLUMN users.empresa_aceite_termo IS 'Se o usuário aceitou o termo de responsabilidade';
COMMENT ON COLUMN users.empresa_aceite_data IS 'Data e hora do aceite do termo de responsabilidade';