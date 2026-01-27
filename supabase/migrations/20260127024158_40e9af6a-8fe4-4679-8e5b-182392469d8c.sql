-- =====================================================
-- MIGRAÇÃO: Módulo de Investimentos Completo + Centros de Custo
-- =====================================================

-- 1. Criar tabela de retornos de investimento
CREATE TABLE IF NOT EXISTS retornos_investimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investimento_id UUID NOT NULL REFERENCES investimentos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  data DATE NOT NULL,
  categoria TEXT CHECK (categoria IN ('dividendo', 'juros', 'venda_ativo', 'operacional', 'outro')),
  comprovante_url TEXT,
  observacao TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_retornos_investimento_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_retornos_investimento_timestamp
  BEFORE UPDATE ON retornos_investimento
  FOR EACH ROW
  EXECUTE FUNCTION update_retornos_investimento_timestamp();

-- 2. Adicionar colunas na tabela investimentos (se não existirem)
DO $$ 
BEGIN
  -- Centro de custo
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investimentos' AND column_name = 'centro_custo_id') THEN
    ALTER TABLE investimentos ADD COLUMN centro_custo_id UUID REFERENCES centros_custo(id);
  END IF;
  
  -- Investidor/Gestora
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investimentos' AND column_name = 'investidor_id') THEN
    ALTER TABLE investimentos ADD COLUMN investidor_id UUID REFERENCES auth.users(id);
  END IF;
  
  -- Nome do investidor externo
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investimentos' AND column_name = 'investidor_nome') THEN
    ALTER TABLE investimentos ADD COLUMN investidor_nome TEXT;
  END IF;
  
  -- ROI realizado (calculado)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investimentos' AND column_name = 'roi_realizado') THEN
    ALTER TABLE investimentos ADD COLUMN roi_realizado NUMERIC(10,4) DEFAULT 0;
  END IF;
  
  -- Payback em meses (calculado)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investimentos' AND column_name = 'payback_meses') THEN
    ALTER TABLE investimentos ADD COLUMN payback_meses INTEGER;
  END IF;
  
  -- Data do payback (quando atingiu o breakeven)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investimentos' AND column_name = 'data_payback') THEN
    ALTER TABLE investimentos ADD COLUMN data_payback DATE;
  END IF;
  
  -- Retorno total acumulado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'investimentos' AND column_name = 'retorno_acumulado') THEN
    ALTER TABLE investimentos ADD COLUMN retorno_acumulado NUMERIC(15,2) DEFAULT 0;
  END IF;
END $$;

-- 3. Seed de Centros de Custo padrão
INSERT INTO centros_custo (codigo, nome, departamento, orcamento_mensal, ativo)
VALUES
  ('OPER', 'Operacional', 'Operações', 10000.00, true),
  ('ADMIN', 'Administrativo', 'Administração', 5000.00, true),
  ('MARK', 'Marketing', 'Comercial', 3000.00, true),
  ('TI', 'Tecnologia', 'TI', 8000.00, true),
  ('INV', 'Investimentos', 'Financeiro', 0.00, true),
  ('GEST', 'Gestoras Externas', 'Financeiro', 0.00, true)
ON CONFLICT (codigo) DO NOTHING;

-- 4. Função para calcular ROI e Payback de um investimento
CREATE OR REPLACE FUNCTION calcular_metricas_investimento(p_investimento_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_valor_investido NUMERIC;
  v_retorno_total NUMERIC;
  v_roi NUMERIC;
  v_meses_desde_inicio INTEGER;
  v_retorno_mensal_medio NUMERIC;
  v_payback_meses INTEGER;
  v_data_inicio DATE;
BEGIN
  -- Buscar valor investido
  SELECT valor, data INTO v_valor_investido, v_data_inicio
  FROM investimentos
  WHERE id = p_investimento_id;
  
  IF v_valor_investido IS NULL THEN
    RETURN json_build_object('error', 'Investimento não encontrado');
  END IF;
  
  -- Calcular retorno total
  SELECT COALESCE(SUM(valor), 0) INTO v_retorno_total
  FROM retornos_investimento
  WHERE investimento_id = p_investimento_id;
  
  -- Calcular ROI
  IF v_valor_investido > 0 THEN
    v_roi := ((v_retorno_total - v_valor_investido) / v_valor_investido) * 100;
  ELSE
    v_roi := 0;
  END IF;
  
  -- Calcular meses desde o início
  v_meses_desde_inicio := GREATEST(1, EXTRACT(MONTH FROM AGE(CURRENT_DATE, v_data_inicio))::INTEGER + 
    (EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_data_inicio))::INTEGER * 12));
  
  -- Calcular retorno mensal médio
  IF v_meses_desde_inicio > 0 THEN
    v_retorno_mensal_medio := v_retorno_total / v_meses_desde_inicio;
  ELSE
    v_retorno_mensal_medio := 0;
  END IF;
  
  -- Calcular payback estimado
  IF v_retorno_mensal_medio > 0 THEN
    v_payback_meses := CEIL(v_valor_investido / v_retorno_mensal_medio)::INTEGER;
  ELSE
    v_payback_meses := NULL;
  END IF;
  
  -- Atualizar o investimento com as métricas
  UPDATE investimentos 
  SET 
    roi_realizado = v_roi,
    retorno_acumulado = v_retorno_total,
    payback_meses = v_payback_meses,
    data_payback = CASE 
      WHEN v_retorno_total >= v_valor_investido THEN CURRENT_DATE 
      ELSE NULL 
    END,
    updated_at = NOW()
  WHERE id = p_investimento_id;
  
  RETURN json_build_object(
    'investimento_id', p_investimento_id,
    'valor_investido', v_valor_investido,
    'retorno_total', v_retorno_total,
    'roi_percent', ROUND(v_roi, 2),
    'meses_desde_inicio', v_meses_desde_inicio,
    'retorno_mensal_medio', ROUND(v_retorno_mensal_medio, 2),
    'payback_estimado_meses', v_payback_meses,
    'atingiu_payback', v_retorno_total >= v_valor_investido
  );
END;
$$;

-- 5. Trigger para recalcular métricas quando um retorno é inserido/atualizado
CREATE OR REPLACE FUNCTION trigger_recalcular_metricas_investimento()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calcular_metricas_investimento(OLD.investimento_id);
    RETURN OLD;
  ELSE
    PERFORM calcular_metricas_investimento(NEW.investimento_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalc_investimento ON retornos_investimento;
CREATE TRIGGER trigger_recalc_investimento
  AFTER INSERT OR UPDATE OR DELETE ON retornos_investimento
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalcular_metricas_investimento();

-- 6. RLS para retornos_investimento
ALTER TABLE retornos_investimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver retornos" ON retornos_investimento
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados podem inserir retornos" ON retornos_investimento
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem atualizar retornos" ON retornos_investimento
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados podem deletar retornos" ON retornos_investimento
  FOR DELETE TO authenticated USING (true);

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_retornos_investimento_investimento_id 
  ON retornos_investimento(investimento_id);
  
CREATE INDEX IF NOT EXISTS idx_retornos_investimento_data 
  ON retornos_investimento(data);

CREATE INDEX IF NOT EXISTS idx_investimentos_centro_custo 
  ON investimentos(centro_custo_id);

CREATE INDEX IF NOT EXISTS idx_investimentos_status 
  ON investimentos(status);