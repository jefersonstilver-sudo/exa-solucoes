-- ============================================
-- FINANCEIRO v1.3 — CENTRO DE CUSTO (BACKEND ONLY)
-- ============================================

-- 1. TABELA CENTROS_CUSTO
CREATE TABLE public.centros_custo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  departamento TEXT,
  orcamento_mensal NUMERIC(12,2),
  responsavel_id UUID REFERENCES public.funcionarios(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. RELAÇÕES (FKs)
ALTER TABLE public.despesas_fixas
ADD COLUMN centro_custo_id UUID REFERENCES public.centros_custo(id);

ALTER TABLE public.assinaturas_operacionais
ADD COLUMN centro_custo_id UUID REFERENCES public.centros_custo(id);

-- 3. RLS
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar centros de custo"
ON public.centros_custo FOR ALL
TO authenticated
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));

-- 4. VIEW DE AGREGAÇÃO
CREATE OR REPLACE VIEW public.vw_custo_por_centro AS
SELECT 
  cc.id AS centro_custo_id,
  cc.codigo,
  cc.nome,
  cc.orcamento_mensal,
  DATE_TRUNC('month', pd.data_vencimento) AS competencia,
  SUM(CASE WHEN pd.status = 'pago' THEN pd.valor ELSE 0 END) AS custo_realizado,
  SUM(CASE WHEN pd.status = 'pendente' THEN pd.valor ELSE 0 END) AS custo_pendente,
  COUNT(DISTINCT f.id) AS headcount
FROM public.centros_custo cc
LEFT JOIN public.despesas_fixas df ON df.centro_custo_id = cc.id AND df.ativo = true
LEFT JOIN public.parcelas_despesas pd ON pd.despesa_fixa_id = df.id
LEFT JOIN public.funcionarios f ON f.departamento = cc.departamento AND f.ativo = true
WHERE cc.ativo = true
GROUP BY cc.id, cc.codigo, cc.nome, cc.orcamento_mensal, DATE_TRUNC('month', pd.data_vencimento);

-- 5. TRIGGER UPDATED_AT
CREATE TRIGGER update_centros_custo_updated_at
BEFORE UPDATE ON public.centros_custo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();