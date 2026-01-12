-- Adicionar colunas de dados do cliente na tabela de logs de aceite
ALTER TABLE public.contract_acceptance_logs 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS client_email TEXT,
ADD COLUMN IF NOT EXISTS client_document TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.contract_acceptance_logs.client_name IS 'Nome do cliente no momento do aceite';
COMMENT ON COLUMN public.contract_acceptance_logs.client_email IS 'Email do cliente no momento do aceite';
COMMENT ON COLUMN public.contract_acceptance_logs.client_document IS 'CPF/CNPJ do cliente no momento do aceite';