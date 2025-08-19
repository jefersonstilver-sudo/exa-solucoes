
-- 1) Atualizar o CHECK constraint de status para aceitar valores com e sem acento
ALTER TABLE public.buildings
  DROP CONSTRAINT IF EXISTS buildings_status_check;

ALTER TABLE public.buildings
  ADD CONSTRAINT buildings_status_check
  CHECK (status IN (
    'ativo',
    'manutenção',
    'instalação',
    'inativo',
    -- compatibilidade com dados antigos sem acento
    'manutencao',
    'instalacao'
  ));

-- 2) Atualizar função pública para a loja: incluir prédios "Em instalação"
CREATE OR REPLACE FUNCTION public.get_public_buildings()
RETURNS TABLE(
  id uuid, nome text, endereco text, bairro text, status text, venue_type text, monthly_traffic integer,
  latitude numeric, longitude numeric, manual_latitude numeric, manual_longitude numeric,
  position_validated boolean, numero_unidades integer, publico_estimado integer, preco_base numeric,
  image_urls text[], amenities text[], padrao_publico text, quantidade_telas integer,
  visualizacoes_mes integer, imagem_principal text, imagem_2 text, imagem_3 text, imagem_4 text,
  caracteristicas text[], created_at timestamptz
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
    b.manual_latitude,
    b.manual_longitude,
    b.position_validated,
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
  WHERE b.status IN ('ativo', 'instalação', 'instalacao');
$function$;
