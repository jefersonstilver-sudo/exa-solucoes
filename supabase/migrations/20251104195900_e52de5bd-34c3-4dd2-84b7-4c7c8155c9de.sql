-- Adicionar campos à tabela provider_benefits para suportar código/link e instruções
ALTER TABLE provider_benefits 
ADD COLUMN IF NOT EXISTS delivery_type text CHECK (delivery_type IN ('code', 'link')),
ADD COLUMN IF NOT EXISTS redemption_instructions text;

-- Criar tabela para gerenciar os benefícios disponíveis
CREATE TABLE IF NOT EXISTS available_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subtitle text,
  icon text NOT NULL,
  category text NOT NULL CHECK (category IN ('shopping', 'food', 'transport', 'entertainment')),
  delivery_days integer NOT NULL DEFAULT 3 CHECK (delivery_days IN (1, 3)),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS para available_benefits
ALTER TABLE available_benefits ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar benefícios
CREATE POLICY "Admins can manage available benefits"
ON available_benefits
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Todos podem visualizar benefícios ativos
CREATE POLICY "Anyone can view active benefits"
ON available_benefits
FOR SELECT
USING (is_active = true);

-- Inserir benefícios padrão
INSERT INTO available_benefits (name, subtitle, icon, category, delivery_days, sort_order) VALUES
  ('Shopee', 'Vale-compras online', 'ShoppingBag', 'shopping', 3, 1),
  ('Renner', 'Moda e estilo', 'Shirt', 'shopping', 3, 2),
  ('Riachuelo', 'Vestuário e acessórios', 'ShoppingCart', 'shopping', 3, 3),
  ('Havaianas', 'Calçados confortáveis', 'Footprints', 'shopping', 3, 4),
  ('Arezzo', 'Calçados premium', 'Heels', 'shopping', 3, 5),
  ('Petz', 'Para seu pet', 'PawPrint', 'shopping', 3, 6),
  ('Cacau Show', 'Chocolates artesanais', 'IceCream', 'food', 1, 7),
  ('McDonald''s', 'Fast food favorito', 'Beef', 'food', 1, 8),
  ('Madero', 'Hambúrgueres gourmet', 'UtensilsCrossed', 'food', 1, 9),
  ('Jeronimo', 'Pizza e massas', 'Pizza', 'food', 1, 10),
  ('Zé Delivery', 'Bebidas geladas', 'Beer', 'food', 1, 11),
  ('Uber', 'Transporte rápido', 'Car', 'transport', 1, 12),
  ('Spotify', 'Música ilimitada', 'Music', 'entertainment', 1, 13),
  ('Netflix', 'Filmes e séries', 'Tv', 'entertainment', 1, 14)
ON CONFLICT DO NOTHING;