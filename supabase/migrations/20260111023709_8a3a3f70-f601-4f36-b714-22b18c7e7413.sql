-- =============================================
-- FASE 1: Núcleo Operacional de Despesas - COMPLETO
-- =============================================

-- 1. Criar tabela de subcategorias
CREATE TABLE IF NOT EXISTS public.subcategorias_despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID NOT NULL REFERENCES public.categorias_despesas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(categoria_id, nome)
);

-- 2. Criar tabela de parcelas de despesas (recorrência)
CREATE TABLE IF NOT EXISTS public.parcelas_despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  despesa_fixa_id UUID NOT NULL REFERENCES public.despesas_fixas(id) ON DELETE CASCADE,
  competencia VARCHAR(7) NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  data_pagamento DATE,
  comprovante_url TEXT,
  registrado_por UUID REFERENCES auth.users(id),
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(despesa_fixa_id, competencia)
);

-- 3. Adicionar FK de subcategoria nas tabelas existentes
ALTER TABLE public.despesas_fixas 
ADD COLUMN IF NOT EXISTS subcategoria_id UUID REFERENCES public.subcategorias_despesas(id);

ALTER TABLE public.despesas_variaveis 
ADD COLUMN IF NOT EXISTS subcategoria_id UUID REFERENCES public.subcategorias_despesas(id);

-- 4. Índices para performance (IF NOT EXISTS via DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subcategorias_categoria') THEN
    CREATE INDEX idx_subcategorias_categoria ON public.subcategorias_despesas(categoria_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_subcategorias_ativo') THEN
    CREATE INDEX idx_subcategorias_ativo ON public.subcategorias_despesas(ativo);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_parcelas_despesa') THEN
    CREATE INDEX idx_parcelas_despesa ON public.parcelas_despesas(despesa_fixa_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_parcelas_competencia') THEN
    CREATE INDEX idx_parcelas_competencia ON public.parcelas_despesas(competencia);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_parcelas_vencimento') THEN
    CREATE INDEX idx_parcelas_vencimento ON public.parcelas_despesas(data_vencimento);
  END IF;
END $$;

-- 5. RLS para subcategorias_despesas
ALTER TABLE public.subcategorias_despesas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem ver subcategorias" ON public.subcategorias_despesas;
CREATE POLICY "Admins podem ver subcategorias"
ON public.subcategorias_despesas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'super_admin', 'admin_master', 'admin_financeiro', 'financeiro')
  )
);

DROP POLICY IF EXISTS "Admins podem inserir subcategorias" ON public.subcategorias_despesas;
CREATE POLICY "Admins podem inserir subcategorias"
ON public.subcategorias_despesas FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'super_admin', 'admin_master', 'admin_financeiro')
  )
);

DROP POLICY IF EXISTS "Admins podem atualizar subcategorias" ON public.subcategorias_despesas;
CREATE POLICY "Admins podem atualizar subcategorias"
ON public.subcategorias_despesas FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'super_admin', 'admin_master', 'admin_financeiro')
  )
);

DROP POLICY IF EXISTS "Admins podem deletar subcategorias" ON public.subcategorias_despesas;
CREATE POLICY "Admins podem deletar subcategorias"
ON public.subcategorias_despesas FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'super_admin', 'admin_master', 'admin_financeiro')
  )
);

-- 6. RLS para parcelas_despesas
ALTER TABLE public.parcelas_despesas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem ver parcelas" ON public.parcelas_despesas;
CREATE POLICY "Admins podem ver parcelas"
ON public.parcelas_despesas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'super_admin', 'admin_master', 'admin_financeiro', 'financeiro')
  )
);

DROP POLICY IF EXISTS "Admins podem inserir parcelas" ON public.parcelas_despesas;
CREATE POLICY "Admins podem inserir parcelas"
ON public.parcelas_despesas FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'super_admin', 'admin_master', 'admin_financeiro')
  )
);

DROP POLICY IF EXISTS "Admins podem atualizar parcelas" ON public.parcelas_despesas;
CREATE POLICY "Admins podem atualizar parcelas"
ON public.parcelas_despesas FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role IN ('admin', 'super_admin', 'admin_master', 'admin_financeiro')
  )
);

-- 7. Triggers para updated_at
DROP TRIGGER IF EXISTS update_subcategorias_updated_at ON public.subcategorias_despesas;
CREATE TRIGGER update_subcategorias_updated_at
BEFORE UPDATE ON public.subcategorias_despesas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_parcelas_updated_at ON public.parcelas_despesas;
CREATE TRIGGER update_parcelas_updated_at
BEFORE UPDATE ON public.parcelas_despesas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();