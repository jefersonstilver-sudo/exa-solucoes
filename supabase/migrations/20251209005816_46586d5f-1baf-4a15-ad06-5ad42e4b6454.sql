-- Add manual pricing columns for each plan to buildings table
ALTER TABLE public.buildings
ADD COLUMN IF NOT EXISTS preco_trimestral numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preco_semestral numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preco_anual numeric DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.buildings.preco_base IS 'Preço mensal (1 mês) - valor base por painel';
COMMENT ON COLUMN public.buildings.preco_trimestral IS 'Preço total do pacote trimestral (3 meses) - valor manual';
COMMENT ON COLUMN public.buildings.preco_semestral IS 'Preço total do pacote semestral (6 meses) - valor manual';
COMMENT ON COLUMN public.buildings.preco_anual IS 'Preço total do pacote anual (12 meses) - valor manual';