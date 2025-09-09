-- Drop and recreate the function with the updated return type
DROP FUNCTION IF EXISTS public.get_buildings_for_public_store();

CREATE OR REPLACE FUNCTION public.get_buildings_for_public_store()
 RETURNS TABLE(id uuid, nome text, bairro text, endereco text, status text, venue_type text, preco_base numeric, quantidade_telas integer, imagem_principal text, latitude numeric, longitude numeric, amenities text[], caracteristicas text[], publico_estimado integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  -- Return ALL buildings with publico_estimado included
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
    -- Return coordinates even if zero/null - frontend will handle map filtering
    COALESCE(b.manual_latitude, b.latitude) as latitude,
    COALESCE(b.manual_longitude, b.longitude) as longitude,
    COALESCE(b.amenities, ARRAY[]::text[]) as amenities,
    COALESCE(b.caracteristicas, ARRAY[]::text[]) as caracteristicas,
    -- Include publico_estimado with fallback calculation
    COALESCE(b.publico_estimado, b.numero_unidades * 3, 0) as publico_estimado
  FROM public.buildings b
  WHERE b.status IN ('ativo', 'instalação', 'instalacao')
  ORDER BY b.created_at DESC;
$function$