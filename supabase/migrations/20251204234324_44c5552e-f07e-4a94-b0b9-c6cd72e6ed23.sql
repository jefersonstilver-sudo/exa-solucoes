-- Adicionar colunas de endereço e coordenadas na tabela users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS empresa_latitude double precision,
ADD COLUMN IF NOT EXISTS empresa_longitude double precision;

-- Adicionar colunas de endereço e coordenadas na tabela proposals
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS client_address text,
ADD COLUMN IF NOT EXISTS client_latitude double precision,
ADD COLUMN IF NOT EXISTS client_longitude double precision;

-- Adicionar colunas de coordenadas na tabela contratos_legais
ALTER TABLE public.contratos_legais 
ADD COLUMN IF NOT EXISTS cliente_latitude double precision,
ADD COLUMN IF NOT EXISTS cliente_longitude double precision;