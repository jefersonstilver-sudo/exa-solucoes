-- =====================================================
-- FINANCEIRO v1.5: Campos de Classificação em transacoes_asaas
-- =====================================================

-- Adicionar campos para classificação e conciliação de lançamentos
ALTER TABLE public.transacoes_asaas
ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES public.categorias_despesas(id),
ADD COLUMN IF NOT EXISTS tipo_receita TEXT CHECK (tipo_receita IN ('fixa', 'variavel')),
ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS conciliado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS conciliado_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS conciliado_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS observacao TEXT;

-- Índices para filtros
CREATE INDEX IF NOT EXISTS idx_transacoes_asaas_categoria ON public.transacoes_asaas(categoria_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_asaas_tipo_receita ON public.transacoes_asaas(tipo_receita);
CREATE INDEX IF NOT EXISTS idx_transacoes_asaas_conciliado ON public.transacoes_asaas(conciliado);

-- Classificação automática inicial: assinaturas = fixa, avulso = variável
UPDATE public.transacoes_asaas
SET tipo_receita = CASE 
  WHEN raw_data->>'installment' IS NOT NULL THEN 'fixa'
  WHEN description ILIKE '%assinatura%' THEN 'fixa'
  WHEN description ILIKE '%mensal%' THEN 'fixa'
  ELSE 'variavel'
END
WHERE tipo_receita IS NULL;