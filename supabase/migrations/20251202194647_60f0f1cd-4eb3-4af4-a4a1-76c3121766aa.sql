-- Adicionar coluna para armazenar nome do vendedor que respondeu
ALTER TABLE public.escalacoes_comerciais 
ADD COLUMN IF NOT EXISTS responded_by_name TEXT;