-- Adicionar colunas para vinculação de pagamento ASAAS
ALTER TABLE public.despesas_fixas 
ADD COLUMN IF NOT EXISTS asaas_saida_id UUID REFERENCES public.asaas_saidas(id),
ADD COLUMN IF NOT EXISTS valor_pago NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_pagamento DATE;

ALTER TABLE public.despesas_variaveis 
ADD COLUMN IF NOT EXISTS asaas_saida_id UUID REFERENCES public.asaas_saidas(id),
ADD COLUMN IF NOT EXISTS valor_pago NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_pagamento DATE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_despesas_fixas_asaas_saida ON public.despesas_fixas(asaas_saida_id);
CREATE INDEX IF NOT EXISTS idx_despesas_variaveis_asaas_saida ON public.despesas_variaveis(asaas_saida_id);