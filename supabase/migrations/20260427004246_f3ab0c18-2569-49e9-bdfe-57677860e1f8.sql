
ALTER TABLE public.buildings 
  ADD COLUMN IF NOT EXISTS imagem_principal_focus jsonb DEFAULT '{"x":50,"y":50}'::jsonb,
  ADD COLUMN IF NOT EXISTS imagem_2_focus jsonb DEFAULT '{"x":50,"y":50}'::jsonb,
  ADD COLUMN IF NOT EXISTS imagem_3_focus jsonb DEFAULT '{"x":50,"y":50}'::jsonb,
  ADD COLUMN IF NOT EXISTS imagem_4_focus jsonb DEFAULT '{"x":50,"y":50}'::jsonb;

DROP FUNCTION IF EXISTS public.get_buildings_for_public_store();

CREATE OR REPLACE FUNCTION public.get_buildings_for_public_store()
 RETURNS TABLE(id uuid, nome text, bairro text, endereco text, status text, venue_type text, preco_base numeric, quantidade_telas integer, imagem_principal text, imagem_principal_focus jsonb, latitude numeric, longitude numeric, amenities text[], caracteristicas text[], publico_estimado integer, visualizacoes_mes integer, numero_elevadores integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    b.id, b.nome, b.bairro,
    COALESCE(b.endereco, '') as endereco,
    b.status, b.venue_type, b.preco_base, b.quantidade_telas, b.imagem_principal,
    COALESCE(b.imagem_principal_focus, '{"x":50,"y":50}'::jsonb) as imagem_principal_focus,
    COALESCE(b.manual_latitude, b.latitude) as latitude,
    COALESCE(b.manual_longitude, b.longitude) as longitude,
    COALESCE(b.amenities, ARRAY[]::text[]) as amenities,
    COALESCE(b.caracteristicas, ARRAY[]::text[]) as caracteristicas,
    COALESCE(b.publico_estimado, b.numero_unidades * 3, 0) as publico_estimado,
    COALESCE(b.visualizacoes_mes, 0) as visualizacoes_mes,
    COALESCE(b.numero_elevadores, 0) as numero_elevadores
  FROM public.buildings b
  WHERE b.status IN ('ativo', 'instalação', 'instalacao')
    AND b.status != 'interno'
  ORDER BY b.created_at DESC;
$function$;
