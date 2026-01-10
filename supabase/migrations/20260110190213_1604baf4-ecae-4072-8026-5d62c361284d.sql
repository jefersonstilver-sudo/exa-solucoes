-- =====================================================
-- FASE 3 COMPLETA - TODAS AS TABELAS
-- =====================================================

-- 1. Fornecedores
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT UNIQUE NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  tipo fornecedor_tipo NOT NULL DEFAULT 'servico',
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacao TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  motivo_alteracao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Contratos Fornecedores
CREATE TABLE public.contratos_fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE RESTRICT,
  building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor_mensal NUMERIC(15,2),
  valor_total NUMERIC(15,2),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status contrato_status NOT NULL DEFAULT 'ativo',
  periodicidade TEXT DEFAULT 'mensal',
  dia_vencimento INTEGER CHECK (dia_vencimento BETWEEN 1 AND 31),
  tipo_despesa tipo_despesa NOT NULL DEFAULT 'fixa',
  documento_url TEXT,
  observacao TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  motivo_alteracao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Investimentos
CREATE TABLE public.investimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  categoria_id UUID REFERENCES public.categorias_despesas(id) ON DELETE SET NULL,
  tipo investimento_tipo NOT NULL DEFAULT 'capex',
  building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  previsao_retorno DATE,
  retorno_esperado NUMERIC(15,2),
  status investimento_status NOT NULL DEFAULT 'planejado',
  comprovante_url TEXT,
  observacao TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  motivo_alteracao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Aportes Sócios
CREATE TABLE public.aportes_socios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT NOT NULL,
  tipo aporte_tipo NOT NULL DEFAULT 'capital',
  comprovante_url TEXT,
  motivo TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Caixa Manual
CREATE TABLE public.caixa_manual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo caixa_tipo NOT NULL DEFAULT 'entrada',
  origem caixa_origem NOT NULL DEFAULT 'dinheiro',
  valor NUMERIC(15,2) NOT NULL CHECK (valor != 0),
  descricao TEXT NOT NULL,
  motivo TEXT NOT NULL,
  data_movimentacao DATE NOT NULL DEFAULT CURRENT_DATE,
  comprovante_url TEXT,
  building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES public.categorias_despesas(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Configurações Financeiro
CREATE TABLE public.configuracoes_financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  valor JSONB NOT NULL DEFAULT '{}',
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Ajustes tabelas existentes
ALTER TABLE public.despesas_fixas 
  ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES public.categorias_despesas(id),
  ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES public.fornecedores(id),
  ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES public.buildings(id),
  ADD COLUMN IF NOT EXISTS contrato_id UUID REFERENCES public.contratos_fornecedores(id),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS motivo_alteracao TEXT;

ALTER TABLE public.despesas_variaveis 
  ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES public.categorias_despesas(id),
  ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES public.fornecedores(id),
  ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES public.buildings(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS motivo_alteracao TEXT;

ALTER TABLE public.categorias_despesas 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS inclui_investimentos BOOLEAN DEFAULT false;

-- 8. RLS
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aportes_socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caixa_manual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_financeiro ENABLE ROW LEVEL SECURITY;

-- 9. Policies
CREATE POLICY "Admins view fornecedores" ON public.fornecedores FOR SELECT TO authenticated USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Admins manage fornecedores" ON public.fornecedores FOR ALL TO authenticated USING (public.is_admin_or_super());
CREATE POLICY "Admins view contratos" ON public.contratos_fornecedores FOR SELECT TO authenticated USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Admins manage contratos" ON public.contratos_fornecedores FOR ALL TO authenticated USING (public.is_admin_or_super());
CREATE POLICY "Admins view investimentos" ON public.investimentos FOR SELECT TO authenticated USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Admins manage investimentos" ON public.investimentos FOR ALL TO authenticated USING (public.is_admin_or_super());
CREATE POLICY "Admins view aportes" ON public.aportes_socios FOR SELECT TO authenticated USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Super insert aportes" ON public.aportes_socios FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));
CREATE POLICY "Admins view caixa" ON public.caixa_manual FOR SELECT TO authenticated USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Admins insert caixa" ON public.caixa_manual FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_super());
CREATE POLICY "Admins view config" ON public.configuracoes_financeiro FOR SELECT TO authenticated USING (public.has_any_admin_role(auth.uid()));
CREATE POLICY "Super manage config" ON public.configuracoes_financeiro FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

-- 10. Índices
CREATE INDEX idx_fornecedores_cnpj ON public.fornecedores(cnpj);
CREATE INDEX idx_contratos_fornecedor ON public.contratos_fornecedores(fornecedor_id);
CREATE INDEX idx_contratos_building ON public.contratos_fornecedores(building_id);
CREATE INDEX idx_investimentos_status ON public.investimentos(status);
CREATE INDEX idx_aportes_data ON public.aportes_socios(data);
CREATE INDEX idx_caixa_data ON public.caixa_manual(data_movimentacao);

-- 11. Dados iniciais
INSERT INTO public.configuracoes_financeiro (chave, valor, descricao) VALUES
  ('alerta_vencimento_dias', '{"valor": 3}', 'Dias antes do vencimento para alerta'),
  ('taxa_juros_atraso', '{"valor": 1.0}', 'Taxa juros mensal (%)'),
  ('taxa_multa_atraso', '{"valor": 2.0}', 'Multa por atraso (%)'),
  ('reconciliacao_automatica', '{"ativo": true}', 'Reconciliação automática ASAAS')
ON CONFLICT (chave) DO NOTHING;