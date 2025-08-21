-- SECURITY FIX: Replace public buildings function with secure minimal data access
-- Remove the existing public function and create a secure alternative

-- Drop the existing public function that exposes too much data
DROP FUNCTION IF EXISTS public.get_public_buildings();

-- Create a secure function that only exposes minimal data for legitimate public use
-- This function only returns basic building info needed for building selection
CREATE OR REPLACE FUNCTION public.get_buildings_for_authenticated_users()
RETURNS TABLE(
  id uuid,
  nome text,
  bairro text,
  status text,
  venue_type text,
  preco_base numeric,
  quantidade_telas integer,
  imagem_principal text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  -- Only return minimal data for authenticated users
  SELECT 
    b.id,
    b.nome,
    b.bairro,
    b.status,
    b.venue_type,
    b.preco_base,
    b.quantidade_telas,
    b.imagem_principal
  FROM public.buildings b
  WHERE b.status IN ('ativo', 'instalação', 'instalacao')
  AND auth.uid() IS NOT NULL  -- Require authentication
  ORDER BY b.created_at DESC;
$$;

-- Create an even more restricted function for public building names only (if needed)
CREATE OR REPLACE FUNCTION public.get_building_names_public(building_ids uuid[])
RETURNS TABLE(
  id uuid,
  nome text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  -- Only return building names for specific IDs, no sensitive data
  SELECT 
    b.id,
    b.nome
  FROM public.buildings b
  WHERE b.id = ANY(building_ids)
  AND b.status IN ('ativo', 'instalação', 'instalacao');
$$;

-- Log this security fix
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'SECURITY_FIX_APPLIED',
  'Removed get_public_buildings() function that exposed sensitive business data. Created secure alternatives with authentication requirements.'
);