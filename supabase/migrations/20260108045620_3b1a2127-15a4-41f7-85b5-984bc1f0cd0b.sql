-- =====================================================
-- FASE 3: MÓDULO FINANCEIRO EXECUTIVO
-- =====================================================

-- 1. Atualizar tabela assinaturas para billing completo
ALTER TABLE assinaturas 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS valor_mensal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_inicio DATE,
ADD COLUMN IF NOT EXISTS data_fim DATE;

-- Atualizar client_id a partir da venda
UPDATE assinaturas a
SET client_id = v.client_id
FROM vendas v
WHERE a.venda_id = v.id AND a.client_id IS NULL;

-- 2. COBRANÇAS (charges - receita esperada)
CREATE TABLE IF NOT EXISTS cobrancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assinatura_id UUID REFERENCES assinaturas(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id),
  competencia VARCHAR(7) NOT NULL, -- YYYY-MM
  valor NUMERIC NOT NULL,
  data_vencimento DATE NOT NULL,
  data_emissao DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  dias_atraso INTEGER DEFAULT 0,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RECEBIMENTOS (payments - receita realizada)
CREATE TABLE IF NOT EXISTS recebimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cobranca_id UUID REFERENCES cobrancas(id) ON DELETE SET NULL,
  client_id UUID REFERENCES auth.users(id),
  valor_pago NUMERIC NOT NULL,
  data_pagamento DATE NOT NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('pix', 'boleto', 'cartao', 'transferencia', 'dinheiro')),
  origem TEXT NOT NULL DEFAULT 'manual' CHECK (origem IN ('manual', 'mp', 'asaas', 'stripe')),
  comprovante_url TEXT,
  observacao TEXT,
  registrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. DESPESAS FIXAS
CREATE TABLE IF NOT EXISTS despesas_fixas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  periodicidade TEXT NOT NULL DEFAULT 'mensal'
    CHECK (periodicidade IN ('mensal', 'trimestral', 'semestral', 'anual')),
  categoria TEXT NOT NULL,
  dia_vencimento INTEGER DEFAULT 10,
  ativo BOOLEAN DEFAULT true,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. DESPESAS VARIÁVEIS
CREATE TABLE IF NOT EXISTS despesas_variaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data DATE NOT NULL,
  categoria TEXT NOT NULL,
  pago BOOLEAN DEFAULT false,
  data_pagamento DATE,
  comprovante_url TEXT,
  observacao TEXT,
  registrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. IMPOSTOS
CREATE TABLE IF NOT EXISTS impostos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competencia VARCHAR(7) NOT NULL, -- YYYY-MM
  tipo TEXT NOT NULL, -- ISS, IRPJ, CSLL, PIS, COFINS, etc
  percentual NUMERIC NOT NULL,
  base_calculo NUMERIC NOT NULL,
  valor_estimado NUMERIC NOT NULL,
  valor_pago NUMERIC DEFAULT 0,
  data_vencimento DATE,
  pago BOOLEAN DEFAULT false,
  data_pagamento DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CATEGORIAS DE DESPESAS (referência)
CREATE TABLE IF NOT EXISTS categorias_despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('fixa', 'variavel', 'ambos')),
  cor TEXT DEFAULT '#6B7280',
  icone TEXT DEFAULT 'circle',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir categorias padrão
INSERT INTO categorias_despesas (nome, tipo, cor, icone) VALUES
  ('Aluguel', 'fixa', '#EF4444', 'home'),
  ('Folha de Pagamento', 'fixa', '#F59E0B', 'users'),
  ('Internet/Telefone', 'fixa', '#3B82F6', 'wifi'),
  ('Software/SaaS', 'fixa', '#8B5CF6', 'code'),
  ('Contabilidade', 'fixa', '#10B981', 'calculator'),
  ('Marketing', 'variavel', '#EC4899', 'megaphone'),
  ('Equipamentos', 'variavel', '#6366F1', 'monitor'),
  ('Viagens', 'variavel', '#14B8A6', 'plane'),
  ('Jurídico', 'variavel', '#F97316', 'scale'),
  ('Manutenção', 'variavel', '#64748B', 'wrench'),
  ('Outros', 'ambos', '#6B7280', 'circle')
ON CONFLICT (nome) DO NOTHING;

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_cobrancas_assinatura ON cobrancas(assinatura_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_client ON cobrancas(client_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_competencia ON cobrancas(competencia);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON cobrancas(status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_vencimento ON cobrancas(data_vencimento);

CREATE INDEX IF NOT EXISTS idx_recebimentos_cobranca ON recebimentos(cobranca_id);
CREATE INDEX IF NOT EXISTS idx_recebimentos_client ON recebimentos(client_id);
CREATE INDEX IF NOT EXISTS idx_recebimentos_data ON recebimentos(data_pagamento);

CREATE INDEX IF NOT EXISTS idx_despesas_variaveis_data ON despesas_variaveis(data);
CREATE INDEX IF NOT EXISTS idx_despesas_variaveis_categoria ON despesas_variaveis(categoria);

CREATE INDEX IF NOT EXISTS idx_impostos_competencia ON impostos(competencia);

-- RLS
ALTER TABLE cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE recebimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas_fixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas_variaveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE impostos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_despesas ENABLE ROW LEVEL SECURITY;

-- Políticas: Apenas admin/financeiro podem ver dados financeiros
CREATE POLICY "Admin pode ver cobrancas" ON cobrancas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin', 'financeiro', 'admin_master')
    )
  );

CREATE POLICY "Admin pode ver recebimentos" ON recebimentos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin', 'financeiro', 'admin_master')
    )
  );

CREATE POLICY "Admin pode ver despesas_fixas" ON despesas_fixas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin', 'financeiro', 'admin_master')
    )
  );

CREATE POLICY "Admin pode ver despesas_variaveis" ON despesas_variaveis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin', 'financeiro', 'admin_master')
    )
  );

CREATE POLICY "Admin pode ver impostos" ON impostos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'super_admin', 'financeiro', 'admin_master')
    )
  );

CREATE POLICY "Todos podem ver categorias" ON categorias_despesas
  FOR SELECT USING (true);

-- Trigger para atualizar dias de atraso
CREATE OR REPLACE FUNCTION atualizar_dias_atraso()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pendente' AND NEW.data_vencimento < CURRENT_DATE THEN
    NEW.status := 'vencido';
    NEW.dias_atraso := CURRENT_DATE - NEW.data_vencimento;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_dias_atraso
BEFORE INSERT OR UPDATE ON cobrancas
FOR EACH ROW EXECUTE FUNCTION atualizar_dias_atraso();

-- Trigger updated_at
CREATE TRIGGER update_cobrancas_updated_at
BEFORE UPDATE ON cobrancas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recebimentos_updated_at
BEFORE UPDATE ON recebimentos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_despesas_fixas_updated_at
BEFORE UPDATE ON despesas_fixas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_despesas_variaveis_updated_at
BEFORE UPDATE ON despesas_variaveis
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_impostos_updated_at
BEFORE UPDATE ON impostos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();