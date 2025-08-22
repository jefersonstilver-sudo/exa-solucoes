-- Criar função RPC pública para loja de prédios (não requer autenticação)
CREATE OR REPLACE FUNCTION public.get_buildings_for_public_store()
RETURNS TABLE(
  id uuid, 
  nome text, 
  bairro text, 
  status text, 
  venue_type text, 
  preco_base numeric, 
  quantidade_telas integer, 
  imagem_principal text,
  latitude numeric,
  longitude numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  -- Return buildings with basic info and coordinates for public store
  SELECT 
    b.id,
    b.nome,
    b.bairro,
    b.status,
    b.venue_type,
    b.preco_base,
    b.quantidade_telas,
    b.imagem_principal,
    COALESCE(b.manual_latitude, b.latitude) as latitude,
    COALESCE(b.manual_longitude, b.longitude) as longitude
  FROM public.buildings b
  WHERE b.status IN ('ativo', 'instalação', 'instalacao')
  AND COALESCE(b.manual_latitude, b.latitude) IS NOT NULL
  AND COALESCE(b.manual_longitude, b.longitude) IS NOT NULL
  ORDER BY b.created_at DESC;
$function$;