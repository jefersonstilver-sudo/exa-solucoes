-- 1) Restrict public access to sensitive building contact data
-- Drop overly permissive policies and expose a safe public function

-- Drop public and broad SELECT policies if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'buildings' AND policyname = 'Public can view active buildings'
  ) THEN
    EXECUTE 'DROP POLICY "Public can view active buildings" ON public.buildings';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'buildings' AND policyname = 'auth_users_view_buildings'
  ) THEN
    EXECUTE 'DROP POLICY "auth_users_view_buildings" ON public.buildings';
  END IF;
END $$;

-- Ensure admins can still read the full table (super_admin already has ALL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'buildings' AND policyname = 'admins_view_buildings'
  ) THEN
    EXECUTE $$
      CREATE POLICY admins_view_buildings
      ON public.buildings
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid() AND u.role IN ('admin','super_admin')
        )
      );
    $$;
  END IF;
END $$;

-- Safe, column-limited public function for buildings
CREATE OR REPLACE FUNCTION public.get_public_buildings()
RETURNS TABLE (
  id uuid,
  nome text,
  endereco text,
  bairro text,
  status text,
  venue_type text,
  monthly_traffic integer,
  latitude numeric,
  longitude numeric,
  numero_unidades integer,
  publico_estimado integer,
  preco_base numeric,
  image_urls text[],
  amenities text[],
  padrao_publico text,
  quantidade_telas integer,
  visualizacoes_mes integer,
  imagem_principal text,
  imagem_2 text,
  imagem_3 text,
  imagem_4 text,
  caracteristicas text[],
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    b.id,
    b.nome,
    b.endereco,
    b.bairro,
    b.status,
    b.venue_type,
    b.monthly_traffic,
    b.latitude,
    b.longitude,
    b.numero_unidades,
    b.publico_estimado,
    b.preco_base,
    b.image_urls,
    b.amenities,
    b.padrao_publico,
    b.quantidade_telas,
    b.visualizacoes_mes,
    b.imagem_principal,
    b.imagem_2,
    b.imagem_3,
    b.imagem_4,
    b.caracteristicas,
    b.created_at
  FROM public.buildings b
  WHERE b.status = 'ativo'
$$;

-- Grant execute to public roles
GRANT EXECUTE ON FUNCTION public.get_public_buildings() TO anon, authenticated;