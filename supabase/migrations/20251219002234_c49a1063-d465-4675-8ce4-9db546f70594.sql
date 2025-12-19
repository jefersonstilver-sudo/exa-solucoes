-- Adicionar colunas para período personalizado em dias na tabela proposals
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS custom_days integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_custom_days boolean DEFAULT false;