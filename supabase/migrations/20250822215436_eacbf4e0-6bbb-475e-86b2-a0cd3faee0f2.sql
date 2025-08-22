-- Update get_buildings_for_public_store to ensure valid coordinates
CREATE OR REPLACE FUNCTION public.get_buildings_for_public_store()
RETURNS TABLE(
  id uuid, 
  nome text, 
  bairro text, 
  endereco text,
  status text, 
  venue_type text, 
  preco_base numeric, 
  quantidade_telas integer, 
  imagem_principal text, 
  latitude numeric, 
  longitude numeric,
  amenities text[],
  caracteristicas text[]
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  -- Return buildings with basic info and coordinates for public store
  -- Only return buildings with valid coordinates to prevent map issues
  SELECT 
    b.id,
    b.nome,
    b.bairro,
    COALESCE(b.endereco, '') as endereco,
    b.status,
    b.venue_type,
    b.preco_base,
    b.quantidade_telas,
    b.imagem_principal,
    COALESCE(b.manual_latitude, b.latitude) as latitude,
    COALESCE(b.manual_longitude, b.longitude) as longitude,
    COALESCE(b.amenities, ARRAY[]::text[]) as amenities,
    COALESCE(b.caracteristicas, ARRAY[]::text[]) as caracteristicas
  FROM public.buildings b
  WHERE b.status IN ('ativo', 'instalação', 'instalacao')
  -- CRITICAL: Only return buildings with valid coordinates
  AND COALESCE(b.manual_latitude, b.latitude) IS NOT NULL
  AND COALESCE(b.manual_longitude, b.longitude) IS NOT NULL
  AND COALESCE(b.manual_latitude, b.latitude) != 0
  AND COALESCE(b.manual_longitude, b.longitude) != 0
  ORDER BY b.created_at DESC;
$function$;

-- Insert proper coordinates for Rio Negro if missing
UPDATE public.buildings 
SET latitude = -25.5487182, longitude = -54.58240290000001
WHERE nome ILIKE '%rio negro%' 
AND (latitude IS NULL OR latitude = 0 OR longitude IS NULL OR longitude = 0);