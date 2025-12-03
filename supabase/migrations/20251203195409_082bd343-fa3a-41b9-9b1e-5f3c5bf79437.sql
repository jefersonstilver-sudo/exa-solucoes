-- Add new columns to proposals table for company name and country support
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS client_company_name TEXT,
ADD COLUMN IF NOT EXISTS client_country TEXT DEFAULT 'BR';

-- Add comment for documentation
COMMENT ON COLUMN public.proposals.client_company_name IS 'Nome da empresa do cliente (Razão Social ou Nome Fantasia)';
COMMENT ON COLUMN public.proposals.client_country IS 'País da empresa: BR (Brasil), AR (Argentina), PY (Paraguai)';