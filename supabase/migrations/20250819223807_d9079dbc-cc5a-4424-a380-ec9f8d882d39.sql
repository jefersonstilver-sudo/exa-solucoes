-- Update function to include new building fields so admin lists receive them
CREATE OR REPLACE FUNCTION public.get_admin_buildings_safe()
RETURNS TABLE(
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
  numero_andares integer,
  numero_elevadores integer,
  numero_blocos integer,
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
  created_at timestamp with time zone,
  codigo_predio text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
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
    COALESCE(b.numero_andares, 0) as numero_andares,
    COALESCE(b.numero_elevadores, 0) as numero_elevadores,
    COALESCE(b.numero_blocos, 1) as numero_blocos,
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
    b.created_at,
    b.codigo_predio
  FROM public.buildings b
  WHERE EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'super_admin')
  )
  ORDER BY b.created_at DESC;
$function$;