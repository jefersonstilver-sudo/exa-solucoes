-- Criar tabela para gerenciar logos do ticker
CREATE TABLE public.logos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  color_variant TEXT NOT NULL DEFAULT 'white' CHECK (color_variant IN ('white', 'dark')),
  link_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.logos ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública das logos ativas
CREATE POLICY "Public can view active logos" 
ON public.logos 
FOR SELECT 
USING (is_active = true);

-- Policy para admins gerenciarem todas as logos
CREATE POLICY "Admins can manage all logos" 
ON public.logos 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id = auth.uid() 
  AND users.role IN ('admin', 'super_admin')
));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_logos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_logos_updated_at
  BEFORE UPDATE ON public.logos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_logos_updated_at();

-- Criar índices para performance
CREATE INDEX idx_logos_active_sort ON public.logos (is_active, sort_order) WHERE is_active = true;

-- Inserir as 13 logos identificadas do Supabase Storage
INSERT INTO public.logos (name, file_url, color_variant, sort_order, is_active) VALUES
('Ápice', 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/PAGINA%20PRINCIPAL%20LOGOS/apice.png', 'white', 1, true),
('Barão de Lucena', 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/PAGINA%20PRINCIPAL%20LOGOS/barao.png', 'white', 2, true),
('Blues', 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/PAGINA%20PRINCIPAL%20LOGOS/blues.png', 'white', 3, true),
('Brasília Shopping', 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/PAGINA%20PRINCIPAL%20LOGOS/brasilia_shopping.png', 'white', 4, true),
('Cinecataratas', 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/PAGINA%20PRINCIPAL%20LOGOS/cinecataratas.png', 'white', 5, true),
('Del Rey', 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/PAGINA%20PRINCIPAL%20LOGOS/del_rey.png', 'white', 6, true),
('Figueira', 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/PAGINA%20PRINCIPAL%20LOGOS/figueira.png', 'white', 7, true),
('Itamaraty', 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/PAGINA%20PRINCIPAL%20LOGOS/itamaraty.png', 'white', 8, true),
('Jardins', 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/PAGINA%20PRINCIPAL%20LOGOS/jardins.png', 'white', 9, true),
('MGA', 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/PAGINA%20PRINCIPAL%20LOGOS/mga.png', 'white', 10, true),
('Palladium', 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/PAGINA%20PRINCIPAL%20LOGOS/palladium.png', 'white', 11, true),
('Santorini', 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/PAGINA%20PRINCIPAL%20LOGOS/santorini.png', 'white', 12, true),
('Zena', 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/PAGINA%20PRINCIPAL%20LOGOS/zena.png', 'white', 13, true);