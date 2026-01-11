-- Fix: manter tipos das colunas da view compatíveis (numeric(12,2))

-- 1) Tabela para registrar saídas do ASAAS (transferências, pagamentos de boletos, etc.)
CREATE TABLE IF NOT EXISTS public.asaas_saidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_id text NOT NULL UNIQUE,
  asaas_tipo text NOT NULL, -- 'transfer' | 'bill'
  data date NOT NULL,
  descricao text,
  valor numeric(12,2) NOT NULL,
  valor_liquido numeric(12,2),
  metodo_pagamento text,
  status text,
  status_original text,
  cliente text,
  external_reference text,
  raw_data jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asaas_saidas_data ON public.asaas_saidas (data);
CREATE INDEX IF NOT EXISTS idx_asaas_saidas_tipo ON public.asaas_saidas (asaas_tipo);

-- 2) RLS
ALTER TABLE public.asaas_saidas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "asaas_saidas_select_admin"
  ON public.asaas_saidas
  FOR SELECT TO authenticated
  USING (public.has_any_admin_role(auth.uid()));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "asaas_saidas_no_client_write"
  ON public.asaas_saidas
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3) updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_asaas_saidas_updated_at ON public.asaas_saidas;
CREATE TRIGGER trg_asaas_saidas_updated_at
BEFORE UPDATE ON public.asaas_saidas
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_timestamp();

-- 4) Recriar a view unificada incluindo saídas ASAAS
DROP VIEW IF EXISTS public.vw_fluxo_caixa_real;

CREATE VIEW public.vw_fluxo_caixa_real AS
SELECT t.id,
  'entrada'::text AS tipo,
  COALESCE(t.data_pagamento::date, t.data_vencimento) AS data,
  t.description AS descricao,
  t.valor,
  t.valor_liquido,
  t.billing_type AS metodo_pagamento,
  CASE
    WHEN t.status = ANY (ARRAY['RECEIVED'::text, 'CONFIRMED'::text]) THEN 'realizado'::text
    WHEN t.status = 'OVERDUE'::text THEN 'atrasado'::text
    WHEN t.status = ANY (ARRAY['REFUNDED'::text, 'CANCELLED'::text]) THEN 'cancelado'::text
    ELSE 'projetado'::text
  END AS status,
  t.status AS status_original,
  'asaas'::text AS origem,
  t.payment_id AS origem_id,
  t.customer_name AS cliente,
  t.external_reference,
  t.created_at
FROM public.transacoes_asaas t
WHERE t.status <> ALL (ARRAY['REFUNDED'::text, 'CANCELLED'::text])

UNION ALL

SELECT p.id,
  'saida'::text AS tipo,
  COALESCE(p.data_pagamento, p.data_vencimento) AS data,
  COALESCE(df.descricao, ao.nome, 'Despesa'::text) AS descricao,
  p.valor,
  p.valor AS valor_liquido,
  p.observacao AS metodo_pagamento,
  CASE
    WHEN p.status = 'pago'::text THEN 'realizado'::text
    WHEN p.status = 'atrasado'::text THEN 'atrasado'::text
    WHEN p.status = 'cancelado'::text THEN 'cancelado'::text
    ELSE 'projetado'::text
  END AS status,
  p.status AS status_original,
  p.origem,
  COALESCE(p.despesa_fixa_id::text, p.origem_id::text) AS origem_id,
  COALESCE(f.nome_fantasia, f.razao_social, 'Fornecedor'::text) AS cliente,
  NULL::text AS external_reference,
  p.created_at
FROM public.parcelas_despesas p
LEFT JOIN public.despesas_fixas df ON p.despesa_fixa_id = df.id
LEFT JOIN public.assinaturas_operacionais ao ON p.origem = 'assinatura'::text AND p.origem_id = ao.id
LEFT JOIN public.fornecedores f ON df.fornecedor_id = f.id OR ao.fornecedor_id = f.id
WHERE p.status <> 'cancelado'::text

UNION ALL

SELECT s.id,
  'saida'::text AS tipo,
  s.data,
  COALESCE(s.descricao, 'Saída ASAAS'::text) AS descricao,
  (s.valor)::numeric(12,2) AS valor,
  (s.valor_liquido)::numeric(12,2) AS valor_liquido,
  s.metodo_pagamento,
  CASE
    WHEN s.status_original IN ('DONE','PAID') THEN 'realizado'
    WHEN s.status_original IN ('FAILED','CANCELLED','REFUNDED') THEN 'cancelado'
    WHEN s.status_original IN ('PENDING','BANK_PROCESSING','AWAITING_CHECKOUT_RISK_ANALYSIS_REQUEST') THEN 'projetado'
    ELSE COALESCE(s.status, 'projetado')
  END AS status,
  s.status_original,
  'asaas_saida'::text AS origem,
  s.asaas_id AS origem_id,
  s.cliente,
  s.external_reference,
  s.created_at
FROM public.asaas_saidas s

ORDER BY 3 DESC, 14 DESC;