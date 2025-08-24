-- Corrigir função RPC para mostrar todos os prédios na loja, independente das coordenadas
-- O filtro de coordenadas será aplicado apenas no frontend para o mapa

CREATE OR REPLACE FUNCTION public.get_buildings_for_public_store()
 RETURNS TABLE(id uuid, nome text, bairro text, endereco text, status text, venue_type text, preco_base numeric, quantidade_telas integer, imagem_principal text, latitude numeric, longitude numeric, amenities text[], caracteristicas text[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  -- Return ALL buildings regardless of coordinates - filtering will be done on frontend for map only
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
    COALESCE(b.caracteristicas, ARRAY[]::text[]) as caracteristicas
  FROM public.buildings b
  WHERE b.status IN ('ativo', 'instalação', 'instalacao')
  -- REMOVED: Coordinate validation - now ALL active buildings are returned
  ORDER BY b.created_at DESC;
$function$