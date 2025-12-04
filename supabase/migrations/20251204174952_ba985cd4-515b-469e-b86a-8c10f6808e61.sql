-- Tabela para armazenar signatários da EXA Mídia
CREATE TABLE public.signatarios_exa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf TEXT,
  cargo TEXT NOT NULL DEFAULT 'Representante Legal',
  nacionalidade TEXT DEFAULT 'brasileiro',
  estado_civil TEXT DEFAULT 'casado',
  profissao TEXT DEFAULT 'empresário',
  cidade TEXT DEFAULT 'Foz do Iguaçu',
  estado TEXT DEFAULT 'PR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.signatarios_exa ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (somente admin/super_admin)
CREATE POLICY "Admins podem ver signatários" 
ON public.signatarios_exa 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins podem inserir signatários" 
ON public.signatarios_exa 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins podem atualizar signatários" 
ON public.signatarios_exa 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Admins podem deletar signatários" 
ON public.signatarios_exa 
FOR DELETE 
TO authenticated
USING (true);

-- Inserir o signatário padrão (Jeferson)
INSERT INTO public.signatarios_exa (nome, email, cpf, cargo, nacionalidade, estado_civil, profissao, cidade, estado, is_active, is_default)
VALUES (
  'Jeferson Stilver Rodrigues Encina',
  'jeferson@examidia.com.br',
  '055.031.279-00',
  'Representante Legal',
  'brasileiro',
  'casado',
  'empresário',
  'Foz do Iguaçu',
  'PR',
  true,
  true
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_signatarios_exa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_signatarios_exa_updated_at
BEFORE UPDATE ON public.signatarios_exa
FOR EACH ROW
EXECUTE FUNCTION public.update_signatarios_exa_updated_at();