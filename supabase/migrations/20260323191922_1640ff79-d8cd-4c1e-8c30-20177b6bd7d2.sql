-- Update public store RPC to explicitly exclude 'interno' status
CREATE OR REPLACE FUNCTION public.get_buildings_for_public_store()
 RETURNS TABLE(id uuid, nome text, bairro text, endereco text, status text, venue_type text, preco_base numeric, quantidade_telas integer, imagem_principal text, latitude numeric, longitude numeric, amenities text[], caracteristicas text[], publico_estimado integer, visualizacoes_mes integer, numero_elevadores integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    b.id, b.nome, b.bairro,
    COALESCE(b.endereco, '') as endereco,
    b.status, b.venue_type, b.preco_base, b.quantidade_telas, b.imagem_principal,
    COALESCE(b.manual_latitude, b.latitude) as latitude,
    COALESCE(b.manual_longitude, b.longitude) as longitude,
    COALESCE(b.amenities, ARRAY[]::text[]) as amenities,
    COALESCE(b.caracteristicas, ARRAY[]::text[]) as caracteristicas,
    COALESCE(b.publico_estimado, b.numero_unidades * 3, 0) as publico_estimado,
    COALESCE(b.visualizacoes_mes, 0) as visualizacoes_mes,
    COALESCE(b.numero_elevadores, 0) as numero_elevadores
  FROM public.buildings b
  WHERE b.status IN ('ativo', 'instalação', 'instalacao')
    AND b.status != 'interno' -- Prédios internos NUNCA aparecem na loja pública
  ORDER BY b.created_at DESC;
$function$;

-- Update authenticated users RPC to also exclude 'interno'
CREATE OR REPLACE FUNCTION public.get_buildings_for_authenticated_users()
 RETURNS TABLE(id uuid, nome text, endereco text, bairro text, codigo_predio text, status text, venue_type text, preco_base numeric, quantidade_telas integer, numero_elevadores integer, publico_estimado integer, visualizacoes_mes integer, imagem_principal text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT 
    b.id, b.nome, b.endereco, b.bairro, b.codigo_predio,
    b.status, b.venue_type, b.preco_base, b.quantidade_telas,
    b.numero_elevadores, b.publico_estimado, b.visualizacoes_mes,
    b.imagem_principal
  FROM public.buildings b
  WHERE b.status IN ('ativo', 'instalação', 'instalacao')
    AND b.status != 'interno' -- Prédios internos NUNCA aparecem na loja pública
  ORDER BY b.created_at DESC;
END;
$function$;