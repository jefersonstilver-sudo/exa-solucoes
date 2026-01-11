-- ============================================================
-- FINANCEIRO v1.2 — ASSINATURAS & BLINDAGEM OPERACIONAL
-- Migração estrutural sem criar tabela separada de parcelas
-- ============================================================

-- 1. NOVOS TIPOS DE ALERTA (extensão do ENUM existente)
ALTER TYPE public.alerta_financeiro_tipo ADD VALUE IF NOT EXISTS 'assinatura_vencendo';
ALTER TYPE public.alerta_financeiro_tipo ADD VALUE IF NOT EXISTS 'assinatura_em_risco';
ALTER TYPE public.alerta_financeiro_tipo ADD VALUE IF NOT EXISTS 'assinatura_suspensa';
ALTER TYPE public.alerta_financeiro_tipo ADD VALUE IF NOT EXISTS 'assinatura_critica';

-- 2. ALTERAÇÕES EM parcelas_despesas
-- 2.1 Tornar despesa_fixa_id NULLABLE para permitir outras origens
ALTER TABLE public.parcelas_despesas 
  ALTER COLUMN despesa_fixa_id DROP NOT NULL;

-- 2.2 Adicionar colunas de rastreamento de origem
ALTER TABLE public.parcelas_despesas
  ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'despesa_fixa',
  ADD COLUMN IF NOT EXISTS origem_id UUID;

-- 2.3 Preencher origem para registros existentes
UPDATE public.parcelas_despesas 
SET origem = 'despesa_fixa' 
WHERE origem IS NULL AND despesa_fixa_id IS NOT NULL;

-- 2.4 Constraint: origem válida + pelo menos um ID presente
ALTER TABLE public.parcelas_despesas
  DROP CONSTRAINT IF EXISTS chk_origem_parcela;

ALTER TABLE public.parcelas_despesas
  ADD CONSTRAINT chk_origem_parcela CHECK (
    origem IN ('despesa_fixa', 'assinatura', 'contrato_fornecedor')
    AND (
      (despesa_fixa_id IS NOT NULL)
      OR 
      (origem_id IS NOT NULL)
    )
  );

-- 2.5 Índice para busca por origem
CREATE INDEX IF NOT EXISTS idx_parcelas_origem ON public.parcelas_despesas(origem);
CREATE INDEX IF NOT EXISTS idx_parcelas_origem_id ON public.parcelas_despesas(origem_id) WHERE origem_id IS NOT NULL;

-- 2.6 Índice único por competência (evita duplicatas por origem)
CREATE UNIQUE INDEX IF NOT EXISTS idx_parcelas_unica_assinatura 
  ON public.parcelas_despesas(origem_id, competencia) 
  WHERE origem = 'assinatura';

-- 3. TABELA assinaturas_operacionais (cadastro de SaaS/ferramentas)
CREATE TABLE IF NOT EXISTS public.assinaturas_operacionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  nome TEXT NOT NULL,
  descricao TEXT,
  
  -- Fornecedor (FK opcional para fornecedores existentes)
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  fornecedor_nome TEXT,
  
  -- Financeiro
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  moeda TEXT DEFAULT 'BRL' CHECK (moeda IN ('BRL', 'USD', 'EUR')),
  periodicidade TEXT NOT NULL CHECK (periodicidade IN ('mensal', 'trimestral', 'semestral', 'anual')),
  
  -- Datas críticas
  data_inicio DATE NOT NULL,
  data_proximo_vencimento DATE NOT NULL,
  dia_vencimento INTEGER DEFAULT 10 CHECK (dia_vencimento BETWEEN 1 AND 28),
  
  -- Categoria (integração com DRE)
  categoria_id UUID REFERENCES public.categorias_despesas(id),
  subcategoria_id UUID REFERENCES public.subcategorias_despesas(id),
  
  -- Status financeiro (controlado pela geração de parcelas)
  ativo BOOLEAN DEFAULT true,
  
  -- Status operacional (separado do financeiro)
  status_operacional TEXT DEFAULT 'normal' CHECK (
    status_operacional IN ('normal', 'atencao', 'em_risco', 'suspensa', 'cancelada')
  ),
  
  -- Impacto operacional (DIFERENCIAL CRÍTICO)
  nivel_criticidade TEXT NOT NULL CHECK (
    nivel_criticidade IN ('baixo', 'medio', 'alto', 'critico')
  ),
  impacto_descricao TEXT NOT NULL,
  sistemas_afetados TEXT[] DEFAULT '{}',
  tempo_tolerancia_horas INTEGER DEFAULT 24 CHECK (tempo_tolerancia_horas > 0),
  
  -- Responsável
  responsavel_id UUID REFERENCES public.funcionarios(id),
  responsavel_email TEXT,
  
  -- Acesso (sem credenciais sensíveis)
  url_acesso TEXT,
  
  -- Auditoria
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  motivo_alteracao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_assinaturas_vencimento 
  ON public.assinaturas_operacionais(data_proximo_vencimento);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status 
  ON public.assinaturas_operacionais(status_operacional);
CREATE INDEX IF NOT EXISTS idx_assinaturas_criticidade 
  ON public.assinaturas_operacionais(nivel_criticidade);
CREATE INDEX IF NOT EXISTS idx_assinaturas_ativo 
  ON public.assinaturas_operacionais(ativo) WHERE ativo = true;

-- 5. RLS PARA assinaturas_operacionais
ALTER TABLE public.assinaturas_operacionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins financeiros podem ver assinaturas"
ON public.assinaturas_operacionais FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin', 'admin_financeiro')
  )
);

CREATE POLICY "Admins podem inserir assinaturas"
ON public.assinaturas_operacionais FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Admins podem atualizar assinaturas"
ON public.assinaturas_operacionais FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Super admins podem deletar assinaturas"
ON public.assinaturas_operacionais FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- 6. TRIGGER PARA UPDATED_AT
CREATE TRIGGER update_assinaturas_updated_at
BEFORE UPDATE ON public.assinaturas_operacionais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. ÍNDICE ÚNICO PARA IDEMPOTÊNCIA DE ALERTAS
CREATE UNIQUE INDEX IF NOT EXISTS idx_alerta_unico_ativo 
  ON public.alertas_financeiros(tipo, entidade_tipo, entidade_id) 
  WHERE ativo = true AND resolvido = false;

-- 8. COMENTÁRIOS DE DOCUMENTAÇÃO
COMMENT ON TABLE public.assinaturas_operacionais IS 
  'Cadastro de assinaturas SaaS e ferramentas operacionais críticas. Parcelas são geradas pelo CRON unificado.';

COMMENT ON COLUMN public.assinaturas_operacionais.status_operacional IS 
  'Status operacional: normal (ok), atencao (vence em breve), em_risco (vence muito em breve), suspensa (atrasada), cancelada';

COMMENT ON COLUMN public.assinaturas_operacionais.nivel_criticidade IS 
  'Criticidade: baixo (ferramentas auxiliares), medio (impacta produtividade), alto (impacta operação), critico (para o sistema)';

COMMENT ON COLUMN public.parcelas_despesas.origem IS 
  'Origem da parcela: despesa_fixa (tradicional), assinatura (SaaS), contrato_fornecedor (contratos recorrentes)';

COMMENT ON COLUMN public.parcelas_despesas.origem_id IS 
  'UUID da entidade origem quando origem != despesa_fixa. Usado para JOIN com assinaturas_operacionais ou contratos_fornecedores';