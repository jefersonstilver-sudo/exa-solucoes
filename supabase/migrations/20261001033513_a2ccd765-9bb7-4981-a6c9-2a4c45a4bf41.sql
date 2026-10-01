ALTER TABLE public.asaas_extrato_movimentos ADD COLUMN ordem_asaas integer;
CREATE INDEX asaas_extrato_ordem_idx ON public.asaas_extrato_movimentos (ordem_asaas ASC NULLS LAST);