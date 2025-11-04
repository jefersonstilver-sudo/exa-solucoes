-- Dropar função antiga
DROP FUNCTION IF EXISTS public.get_buildings_for_authenticated_users();

-- Recriar função com campos corretos incluindo numero_elevadores e publico_estimado
CREATE OR REPLACE FUNCTION public.get_buildings_for_authenticated_users()
RETURNS TABLE (
  id uuid,
  nome text,
  bairro text,
  status text,
  venue_type text,
  preco_base numeric,
  quantidade_telas integer,
  numero_elevadores integer,
  publico_estimado integer,
  imagem_principal text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only return data for authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.nome,
    b.bairro,
    b.status,
    b.venue_type,
    b.preco_base,
    b.quantidade_telas,
    b.numero_elevadores,
    b.publico_estimado,
    b.imagem_principal
  FROM public.buildings b
  WHERE b.status IN ('ativo', 'instalação', 'instalacao')
  ORDER BY b.created_at DESC;
END;
$$;