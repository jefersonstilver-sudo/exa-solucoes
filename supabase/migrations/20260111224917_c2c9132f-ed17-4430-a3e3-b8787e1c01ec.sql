-- Adicionar coluna data_primeiro_lancamento para despesas semanais
ALTER TABLE public.despesas_fixas 
ADD COLUMN IF NOT EXISTS data_primeiro_lancamento date;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.despesas_fixas.data_primeiro_lancamento IS 'Data do primeiro lançamento para despesas semanais. Quando periodicidade=semanal, usa esta data ao invés de dia_vencimento.';