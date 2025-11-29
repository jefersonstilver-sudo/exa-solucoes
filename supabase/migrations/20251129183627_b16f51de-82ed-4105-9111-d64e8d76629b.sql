-- Atualizar função get_buildings_for_authenticated_users para incluir codigo_predio
DROP FUNCTION IF EXISTS public.get_buildings_for_authenticated_users();

CREATE OR REPLACE FUNCTION public.get_buildings_for_authenticated_users()
RETURNS TABLE (
  id uuid,
  nome text,
  endereco text,
  bairro text,
  codigo_predio text,
  status text,
  venue_type text,
  preco_base numeric,
  quantidade_telas integer,
  numero_elevadores integer,
  publico_estimado integer,
  visualizacoes_mes integer,
  imagem_principal text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.nome,
    b.endereco,
    b.bairro,
    b.codigo_predio,
    b.status,
    b.venue_type,
    b.preco_base,
    b.quantidade_telas,
    b.numero_elevadores,
    b.publico_estimado,
    b.visualizacoes_mes,
    b.imagem_principal
  FROM public.buildings b
  WHERE b.status IN ('ativo', 'instalação', 'instalacao')
  ORDER BY b.created_at DESC;
END;
$$;