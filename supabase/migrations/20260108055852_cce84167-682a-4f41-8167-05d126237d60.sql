-- =====================================================
-- FASE 3: Módulo Financeiro Executivo - Triggers e Updates
-- =====================================================

-- 1. Atualizar tabela assinaturas com novos campos
ALTER TABLE assinaturas 
ADD COLUMN IF NOT EXISTS recorrencia TEXT DEFAULT 'mensal',
ADD COLUMN IF NOT EXISTS proxima_cobranca DATE;

-- 2. Preencher valor_mensal das assinaturas existentes a partir de vendas
UPDATE assinaturas a
SET valor_mensal = COALESCE(
  (SELECT v.valor_total / NULLIF(v.plano_meses, 0) FROM vendas v WHERE v.id = a.venda_id),
  a.valor_mensal
)
WHERE a.valor_mensal IS NULL OR a.valor_mensal = 0;

-- 3. Criar índice para performance em cobranças
CREATE INDEX IF NOT EXISTS idx_cobrancas_competencia ON cobrancas(competencia);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON cobrancas(status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_client_status ON cobrancas(client_id, status);

-- 4. Criar índice para despesas
CREATE INDEX IF NOT EXISTS idx_despesas_fixas_ativo ON despesas_fixas(ativo);
CREATE INDEX IF NOT EXISTS idx_despesas_variaveis_data ON despesas_variaveis(data);

-- 5. Criar índice para impostos
CREATE INDEX IF NOT EXISTS idx_impostos_competencia ON impostos(competencia);
CREATE UNIQUE INDEX IF NOT EXISTS idx_impostos_competencia_tipo ON impostos(competencia, tipo);

-- 6. Função para gerar cobranças mensais automaticamente
CREATE OR REPLACE FUNCTION gerar_cobrancas_mensais()
RETURNS void AS $$
BEGIN
  INSERT INTO cobrancas (assinatura_id, client_id, competencia, valor, data_vencimento, status)
  SELECT 
    a.id,
    a.client_id,
    to_char(CURRENT_DATE, 'YYYY-MM'),
    a.valor_mensal,
    (date_trunc('month', CURRENT_DATE) + ((COALESCE(a.dia_vencimento, 10) - 1) || ' days')::interval)::date,
    'pendente'
  FROM assinaturas a
  WHERE a.status = 'ativa'
  AND a.valor_mensal > 0
  AND NOT EXISTS (
    SELECT 1 FROM cobrancas c 
    WHERE c.assinatura_id = a.id 
    AND c.competencia = to_char(CURRENT_DATE, 'YYYY-MM')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Função para calcular impostos do mês
CREATE OR REPLACE FUNCTION calcular_impostos_mes(p_competencia VARCHAR DEFAULT NULL)
RETURNS void AS $$
DECLARE
  v_receita_mes NUMERIC;
  v_competencia VARCHAR(7);
BEGIN
  v_competencia := COALESCE(p_competencia, to_char(CURRENT_DATE, 'YYYY-MM'));
  
  -- Calcular receita do mês a partir de recebimentos
  SELECT COALESCE(SUM(valor_pago), 0)
  INTO v_receita_mes
  FROM recebimentos
  WHERE to_char(data_pagamento, 'YYYY-MM') = v_competencia;
  
  -- Simples Nacional 6% (padrão)
  INSERT INTO impostos (competencia, tipo, percentual, base_calculo, valor_estimado, pago)
  VALUES (v_competencia, 'Simples Nacional', 6.0, v_receita_mes, v_receita_mes * 0.06, false)
  ON CONFLICT (competencia, tipo) DO UPDATE SET
    base_calculo = EXCLUDED.base_calculo,
    valor_estimado = EXCLUDED.valor_estimado,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Função para atualizar dias de atraso nas cobranças
CREATE OR REPLACE FUNCTION atualizar_dias_atraso_cobrancas()
RETURNS void AS $$
BEGIN
  UPDATE cobrancas
  SET 
    dias_atraso = GREATEST(0, CURRENT_DATE - data_vencimento::date),
    status = CASE 
      WHEN status = 'pendente' AND CURRENT_DATE > data_vencimento::date THEN 'vencido'
      ELSE status
    END,
    updated_at = NOW()
  WHERE status IN ('pendente', 'vencido');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Trigger para atualizar proxima_cobranca quando cobrança é gerada
CREATE OR REPLACE FUNCTION trigger_atualizar_proxima_cobranca()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE assinaturas
  SET proxima_cobranca = (
    SELECT MIN(data_vencimento::date)
    FROM cobrancas
    WHERE assinatura_id = NEW.assinatura_id
    AND status = 'pendente'
  )
  WHERE id = NEW.assinatura_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_atualizar_proxima_cobranca ON cobrancas;
CREATE TRIGGER trg_atualizar_proxima_cobranca
AFTER INSERT OR UPDATE ON cobrancas
FOR EACH ROW
EXECUTE FUNCTION trigger_atualizar_proxima_cobranca();

-- 10. Criar tabela fluxo_caixa para projeções
CREATE TABLE IF NOT EXISTS fluxo_caixa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  origem TEXT NOT NULL CHECK (origem IN ('cobranca', 'recebimento', 'despesa_fixa', 'despesa_variavel', 'imposto', 'manual')),
  origem_id UUID,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  data_prevista DATE NOT NULL,
  data_real DATE,
  status TEXT NOT NULL DEFAULT 'projetado' CHECK (status IN ('projetado', 'realizado', 'cancelado')),
  categoria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Índices para fluxo_caixa
CREATE INDEX IF NOT EXISTS idx_fluxo_caixa_data_prevista ON fluxo_caixa(data_prevista);
CREATE INDEX IF NOT EXISTS idx_fluxo_caixa_status ON fluxo_caixa(status);
CREATE INDEX IF NOT EXISTS idx_fluxo_caixa_tipo ON fluxo_caixa(tipo);

-- 12. RLS para fluxo_caixa
ALTER TABLE fluxo_caixa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver fluxo_caixa"
ON fluxo_caixa FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('super_admin', 'admin_master', 'admin', 'financeiro')
  )
);

CREATE POLICY "Financeiro pode gerenciar fluxo_caixa"
ON fluxo_caixa FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('super_admin', 'admin_master', 'financeiro')
  )
);

-- 13. Trigger para inserir no fluxo_caixa quando cobrança é criada
CREATE OR REPLACE FUNCTION trigger_fluxo_caixa_cobranca()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir entrada projetada
  INSERT INTO fluxo_caixa (tipo, origem, origem_id, descricao, valor, data_prevista, status, categoria)
  VALUES (
    'entrada',
    'cobranca',
    NEW.id,
    'Cobrança - ' || COALESCE((SELECT full_name FROM users WHERE id = NEW.client_id), 'Cliente'),
    NEW.valor,
    NEW.data_vencimento::date,
    'projetado',
    'receita'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_fluxo_caixa_cobranca ON cobrancas;
CREATE TRIGGER trg_fluxo_caixa_cobranca
AFTER INSERT ON cobrancas
FOR EACH ROW
EXECUTE FUNCTION trigger_fluxo_caixa_cobranca();

-- 14. Trigger para atualizar fluxo_caixa quando recebimento é registrado
CREATE OR REPLACE FUNCTION trigger_fluxo_caixa_recebimento()
RETURNS TRIGGER AS $$
BEGIN
  -- Marcar cobrança como realizada no fluxo
  UPDATE fluxo_caixa
  SET status = 'realizado', data_real = NEW.data_pagamento::date, updated_at = NOW()
  WHERE origem = 'cobranca' AND origem_id = NEW.cobranca_id;
  
  -- Também registrar o recebimento
  INSERT INTO fluxo_caixa (tipo, origem, origem_id, descricao, valor, data_prevista, data_real, status, categoria)
  VALUES (
    'entrada',
    'recebimento',
    NEW.id,
    'Recebimento confirmado',
    NEW.valor_pago,
    NEW.data_pagamento::date,
    NEW.data_pagamento::date,
    'realizado',
    'receita'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_fluxo_caixa_recebimento ON recebimentos;
CREATE TRIGGER trg_fluxo_caixa_recebimento
AFTER INSERT ON recebimentos
FOR EACH ROW
EXECUTE FUNCTION trigger_fluxo_caixa_recebimento();

-- 15. Trigger para inserir despesas fixas no fluxo_caixa mensalmente
CREATE OR REPLACE FUNCTION gerar_fluxo_despesas_fixas()
RETURNS void AS $$
DECLARE
  v_competencia VARCHAR(7);
BEGIN
  v_competencia := to_char(CURRENT_DATE, 'YYYY-MM');
  
  INSERT INTO fluxo_caixa (tipo, origem, origem_id, descricao, valor, data_prevista, status, categoria)
  SELECT 
    'saida',
    'despesa_fixa',
    df.id,
    df.descricao,
    df.valor,
    (date_trunc('month', CURRENT_DATE) + ((COALESCE(df.dia_vencimento, 10) - 1) || ' days')::interval)::date,
    'projetado',
    df.categoria
  FROM despesas_fixas df
  WHERE df.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM fluxo_caixa fc
    WHERE fc.origem = 'despesa_fixa'
    AND fc.origem_id = df.id
    AND to_char(fc.data_prevista, 'YYYY-MM') = v_competencia
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;