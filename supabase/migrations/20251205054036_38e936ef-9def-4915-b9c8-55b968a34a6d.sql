-- Criar tabela contrato_signatarios para armazenar signatários por contrato
CREATE TABLE IF NOT EXISTS public.contrato_signatarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES public.contratos_legais(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('cliente', 'exa', 'testemunha')),
  nome TEXT NOT NULL,
  sobrenome TEXT,
  email TEXT NOT NULL,
  data_nascimento DATE, -- Campo crítico para ClickSign
  cpf TEXT,
  cargo TEXT,
  signatario_exa_id UUID REFERENCES public.signatarios_exa(id),
  ordem INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.contrato_signatarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view signatarios" 
ON public.contrato_signatarios FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert signatarios" 
ON public.contrato_signatarios FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update signatarios" 
ON public.contrato_signatarios FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete signatarios" 
ON public.contrato_signatarios FOR DELETE TO authenticated USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contrato_signatarios_contrato_id ON public.contrato_signatarios(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_signatarios_tipo ON public.contrato_signatarios(tipo);

-- Adicionar coluna cliente_data_nascimento em contratos_legais se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contratos_legais' 
    AND column_name = 'cliente_data_nascimento') THEN
    ALTER TABLE public.contratos_legais ADD COLUMN cliente_data_nascimento DATE;
  END IF;
END $$;