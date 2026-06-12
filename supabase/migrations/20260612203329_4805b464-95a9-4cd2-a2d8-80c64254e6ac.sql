ALTER TABLE public.predios_cadastro_externo
  ADD COLUMN IF NOT EXISTS valor_mensal numeric(12,2),
  ADD COLUMN IF NOT EXISTS valor_trimestral numeric(12,2),
  ADD COLUMN IF NOT EXISTS valor_semestral numeric(12,2),
  ADD COLUMN IF NOT EXISTS valor_anual numeric(12,2);