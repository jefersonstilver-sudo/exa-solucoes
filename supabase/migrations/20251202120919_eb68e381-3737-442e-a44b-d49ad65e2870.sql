-- Tabela para escalações comerciais
CREATE TABLE IF NOT EXISTS public.escalacoes_comerciais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT,
  phone_number TEXT NOT NULL,
  lead_name TEXT,
  lead_segment TEXT,
  lead_interest TEXT,
  plans_interested TEXT[],
  first_message TEXT,
  conversation_summary TEXT,
  ai_analysis TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_atendimento', 'concluido', 'cancelado')),
  assigned_to TEXT DEFAULT 'eduardo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attended_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Tabela para configuração de vendedores
CREATE TABLE IF NOT EXISTS public.escalacao_vendedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  recebe_escalacoes BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir Eduardo como vendedor padrão
INSERT INTO public.escalacao_vendedores (nome, telefone, ativo, recebe_escalacoes)
VALUES ('Eduardo', '5545991415856', true, true)
ON CONFLICT DO NOTHING;

-- RLS para escalações
ALTER TABLE public.escalacoes_comerciais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode ver escalações" ON public.escalacoes_comerciais
  FOR SELECT USING (true);

CREATE POLICY "Sistema pode inserir escalações" ON public.escalacoes_comerciais
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin pode atualizar escalações" ON public.escalacoes_comerciais
  FOR UPDATE USING (true);

-- RLS para vendedores
ALTER TABLE public.escalacao_vendedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode ver vendedores" ON public.escalacao_vendedores
  FOR SELECT USING (true);

CREATE POLICY "Admin pode inserir vendedores" ON public.escalacao_vendedores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin pode atualizar vendedores" ON public.escalacao_vendedores
  FOR UPDATE USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_escalacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_escalacoes_updated_at
  BEFORE UPDATE ON public.escalacoes_comerciais
  FOR EACH ROW EXECUTE FUNCTION update_escalacoes_updated_at();

CREATE TRIGGER tr_vendedores_updated_at
  BEFORE UPDATE ON public.escalacao_vendedores
  FOR EACH ROW EXECUTE FUNCTION update_escalacoes_updated_at();