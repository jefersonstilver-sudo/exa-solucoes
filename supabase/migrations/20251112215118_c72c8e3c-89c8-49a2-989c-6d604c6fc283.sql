-- Criar tabela para armazenar aceitação de termos de responsabilidade
CREATE TABLE IF NOT EXISTS public.terms_acceptance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version VARCHAR(50) NOT NULL DEFAULT 'v1.0',
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  UNIQUE(user_id, terms_version)
);

-- Habilitar RLS
ALTER TABLE public.terms_acceptance ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Usuários podem ver suas próprias aceitações"
  ON public.terms_acceptance
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias aceitações"
  ON public.terms_acceptance
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_terms_acceptance_user_id ON public.terms_acceptance(user_id);
CREATE INDEX idx_terms_acceptance_accepted_at ON public.terms_acceptance(accepted_at DESC);

-- Comentários
COMMENT ON TABLE public.terms_acceptance IS 'Armazena aceitações de termos de responsabilidade dos usuários para fins jurídicos';
COMMENT ON COLUMN public.terms_acceptance.terms_version IS 'Versão dos termos aceitos';
COMMENT ON COLUMN public.terms_acceptance.ip_address IS 'Endereço IP do usuário no momento da aceitação';
COMMENT ON COLUMN public.terms_acceptance.user_agent IS 'User agent do navegador para registro completo';