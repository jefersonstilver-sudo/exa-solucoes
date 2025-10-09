-- Tabela para configurações da página Sou Síndico
CREATE TABLE IF NOT EXISTS public.configuracoes_sindico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_principal_url TEXT,
  video_secundario_url TEXT,
  condominio_ticker_names TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO public.configuracoes_sindico (video_principal_url, video_secundario_url, condominio_ticker_names)
VALUES (
  NULL,
  NULL,
  ARRAY['Edifício Aurora', 'Condomínio Bela Vista', 'Residencial Panorama', 'Edifício Excellence', 'Condomínio Premium', 'Torres do Parque', 'Residencial Horizonte']
);

-- RLS policies
ALTER TABLE public.configuracoes_sindico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Configurações visíveis para todos" ON public.configuracoes_sindico
  FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem editar" ON public.configuracoes_sindico
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_configuracoes_sindico_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_configuracoes_sindico
  BEFORE UPDATE ON public.configuracoes_sindico
  FOR EACH ROW
  EXECUTE FUNCTION update_configuracoes_sindico_updated_at();