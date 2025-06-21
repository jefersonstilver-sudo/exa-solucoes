
-- Criar tabela para gerenciar imagens do banner rotativo da homepage
CREATE TABLE public.homepage_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  link_url TEXT,
  order_position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índice para ordenação
CREATE INDEX idx_homepage_banners_order ON public.homepage_banners(order_position, is_active);

-- Adicionar comentários para documentação
COMMENT ON TABLE public.homepage_banners IS 'Imagens do banner rotativo da homepage - máximo 5 imagens ativas';
COMMENT ON COLUMN public.homepage_banners.image_url IS 'URL da imagem (recomendado: 1920x600px para desktop, responsivo para mobile)';
COMMENT ON COLUMN public.homepage_banners.order_position IS 'Ordem de exibição das imagens no carousel';
COMMENT ON COLUMN public.homepage_banners.is_active IS 'Se a imagem está ativa e deve ser exibida no banner';

-- Inserir dados de exemplo para teste
INSERT INTO public.homepage_banners (image_url, title, subtitle, link_url, order_position, is_active) VALUES
('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920&h=600', 'Maximize seu Alcance', 'Painéis digitais em locais estratégicos', '/paineis-digitais/loja', 1, true),
('https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1920&h=600', 'Marketing Inovador', 'Soluções completas para sua marca', '/marketing', 2, true),
('https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&q=80&w=1920&h=600', 'Produção Profissional', 'Vídeos de alta qualidade para suas campanhas', '/produtora', 3, true);
