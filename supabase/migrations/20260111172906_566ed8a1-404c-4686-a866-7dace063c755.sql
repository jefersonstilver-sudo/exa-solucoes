-- =============================================================
-- FINANCEIRO v1.4 — Fluxo de Caixa Real (ASAAS)
-- Livro auxiliar de transações ASAAS + View unificada
-- =============================================================

-- 1. Tabela transacoes_asaas (livro auxiliar de receitas)
CREATE TABLE IF NOT EXISTS public.transacoes_asaas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação ASAAS (chave de idempotência)
  payment_id TEXT NOT NULL UNIQUE,
  
  -- Tipo e método de pagamento
  billing_type TEXT NOT NULL, -- PIX, BOLETO, CREDIT_CARD, DEBIT_CARD
  
  -- Status ASAAS
  status TEXT NOT NULL, -- PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, CANCELLED
  
  -- Valores financeiros
  valor NUMERIC(12,2) NOT NULL,
  valor_liquido NUMERIC(12,2), -- Após taxas ASAAS
  taxa_asaas NUMERIC(10,2), -- Taxa cobrada pelo ASAAS
  
  -- Datas
  data_criacao TIMESTAMPTZ NOT NULL,
  data_vencimento DATE,
  data_pagamento TIMESTAMPTZ,
  
  -- Cliente
  customer_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_cpf_cnpj TEXT,
  
  -- Descrição e referência
  description TEXT,
  external_reference TEXT, -- ID do pedido/parcela no EXA
  
  -- PIX específico
  pix_transaction_id TEXT,
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  
  -- Boleto específico
  boleto_url TEXT,
  boleto_barcode TEXT,
  boleto_nosso_numero TEXT,
  
  -- Metadados completos
  raw_data JSONB,
  
  -- Auditoria
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_transacoes_asaas_status ON transacoes_asaas(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_asaas_billing_type ON transacoes_asaas(billing_type);
CREATE INDEX IF NOT EXISTS idx_transacoes_asaas_data_vencimento ON transacoes_asaas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_transacoes_asaas_data_pagamento ON transacoes_asaas(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_transacoes_asaas_external_reference ON transacoes_asaas(external_reference);
CREATE INDEX IF NOT EXISTS idx_transacoes_asaas_customer_id ON transacoes_asaas(customer_id);

-- 3. Trigger para updated_at
CREATE TRIGGER update_transacoes_asaas_updated_at
  BEFORE UPDATE ON transacoes_asaas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RLS
ALTER TABLE transacoes_asaas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem visualizar transacoes_asaas"
  ON transacoes_asaas FOR SELECT
  USING (public.has_any_admin_role());

CREATE POLICY "Service role pode inserir transacoes_asaas"
  ON transacoes_asaas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role pode atualizar transacoes_asaas"
  ON transacoes_asaas FOR UPDATE
  USING (true);

-- 5. VIEW unificada do Fluxo de Caixa Real
CREATE OR REPLACE VIEW public.vw_fluxo_caixa_real AS
-- ENTRADAS: Transações ASAAS
SELECT 
  t.id,
  'entrada'::TEXT AS tipo,
  COALESCE(t.data_pagamento::DATE, t.data_vencimento) AS data,
  t.description AS descricao,
  t.valor,
  t.valor_liquido,
  t.billing_type AS metodo_pagamento,
  CASE 
    WHEN t.status IN ('RECEIVED', 'CONFIRMED') THEN 'realizado'
    WHEN t.status = 'OVERDUE' THEN 'atrasado'
    WHEN t.status IN ('REFUNDED', 'CANCELLED') THEN 'cancelado'
    ELSE 'projetado'
  END AS status,
  t.status AS status_original,
  'asaas'::TEXT AS origem,
  t.payment_id AS origem_id,
  t.customer_name AS cliente,
  t.external_reference,
  t.created_at
FROM transacoes_asaas t
WHERE t.status NOT IN ('REFUNDED', 'CANCELLED')

UNION ALL

-- SAÍDAS: Parcelas de despesas
SELECT 
  p.id,
  'saida'::TEXT AS tipo,
  COALESCE(p.data_pagamento, p.data_vencimento) AS data,
  COALESCE(df.descricao, ao.nome, 'Despesa') AS descricao,
  p.valor,
  p.valor AS valor_liquido,
  p.observacao AS metodo_pagamento,
  CASE 
    WHEN p.status = 'pago' THEN 'realizado'
    WHEN p.status = 'atrasado' THEN 'atrasado'
    WHEN p.status = 'cancelado' THEN 'cancelado'
    ELSE 'projetado'
  END AS status,
  p.status AS status_original,
  p.origem,
  COALESCE(p.despesa_fixa_id::TEXT, p.origem_id::TEXT) AS origem_id,
  COALESCE(f.nome_fantasia, f.razao_social, 'Fornecedor') AS cliente,
  NULL::TEXT AS external_reference,
  p.created_at
FROM parcelas_despesas p
LEFT JOIN despesas_fixas df ON p.despesa_fixa_id = df.id
LEFT JOIN assinaturas_operacionais ao ON p.origem = 'assinatura' AND p.origem_id = ao.id
LEFT JOIN fornecedores f ON df.fornecedor_id = f.id OR ao.fornecedor_id = f.id
WHERE p.status != 'cancelado'

ORDER BY data DESC, created_at DESC;

-- 6. Comentários de documentação
COMMENT ON TABLE transacoes_asaas IS 'Livro auxiliar de transações ASAAS - fonte primária de receitas';
COMMENT ON VIEW vw_fluxo_caixa_real IS 'View unificada do fluxo de caixa: entradas (ASAAS) + saídas (parcelas_despesas)';