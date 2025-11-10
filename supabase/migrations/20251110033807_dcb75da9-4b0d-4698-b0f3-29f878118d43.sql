-- Criar tabela para avisos do condomínio
CREATE TABLE IF NOT EXISTS public.building_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  icon TEXT DEFAULT 'megaphone',
  background_color TEXT DEFAULT '#8B5CF6',
  text_color TEXT DEFAULT '#FFFFFF',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para otimizar queries
CREATE INDEX IF NOT EXISTS idx_building_notices_active 
  ON public.building_notices(building_id, is_active, display_order);

-- Habilitar RLS
ALTER TABLE public.building_notices ENABLE ROW LEVEL SECURITY;

-- Policy: Leitura pública de avisos ativos
CREATE POLICY "Avisos ativos são públicos para leitura"
  ON public.building_notices 
  FOR SELECT 
  USING (is_active = true);

-- Policy: Usuários autenticados podem gerenciar avisos
CREATE POLICY "Usuários autenticados podem gerenciar avisos"
  ON public.building_notices 
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_building_notices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_building_notices_updated_at ON public.building_notices;
CREATE TRIGGER trigger_update_building_notices_updated_at
  BEFORE UPDATE ON public.building_notices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_building_notices_updated_at();

-- Inserir alguns avisos de exemplo (opcional)
INSERT INTO public.building_notices (building_id, title, content, display_order)
SELECT 
  id,
  'Bem-vindo ao ' || nome,
  'Confira os vídeos publicitários em exibição. Para anunciar aqui, entre em contato com a administração.',
  0
FROM public.buildings
WHERE NOT EXISTS (
  SELECT 1 FROM public.building_notices WHERE building_id = buildings.id
)
LIMIT 5;