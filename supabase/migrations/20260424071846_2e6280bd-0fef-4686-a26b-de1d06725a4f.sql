
-- 1. Add columns
ALTER TABLE public.sindicos_interessados
  ADD COLUMN IF NOT EXISTS tipo_predio text,
  ADD COLUMN IF NOT EXISTS permite_airbnb text;

-- 2. Recreate submit_sindico_interesse to also accept the 2 new fields
CREATE OR REPLACE FUNCTION public.submit_sindico_interesse(payload jsonb)
RETURNS TABLE(id uuid, protocolo text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  new_protocolo text;
BEGIN
  INSERT INTO public.sindicos_interessados (
    nome_predio,
    endereco_logradouro,
    endereco_numero,
    endereco_complemento,
    endereco_bairro,
    endereco_cidade,
    endereco_uf,
    cep,
    endereco_latitude,
    endereco_longitude,
    endereco_google_place_id,
    quantidade_andares,
    quantidade_blocos,
    quantidade_unidades_total,
    quantidade_elevadores_sociais,
    internet_operadoras,
    empresa_elevador,
    elevador_casa_maquinas,
    tipo_predio,
    permite_airbnb,
    sindico_nome,
    sindico_cpf,
    sindico_whatsapp,
    sindico_email,
    sindico_mandato_ate,
    aceite_timestamp,
    aceite_ip,
    aceite_user_agent,
    nome_completo,
    endereco,
    numero_andares,
    numero_unidades,
    email,
    celular,
    status
  )
  VALUES (
    payload->>'nome_predio',
    payload->>'endereco_logradouro',
    payload->>'endereco_numero',
    NULLIF(payload->>'endereco_complemento',''),
    payload->>'endereco_bairro',
    payload->>'endereco_cidade',
    payload->>'endereco_uf',
    payload->>'cep',
    NULLIF(payload->>'endereco_latitude','')::numeric,
    NULLIF(payload->>'endereco_longitude','')::numeric,
    NULLIF(payload->>'endereco_google_place_id',''),
    NULLIF(payload->>'quantidade_andares','')::int,
    COALESCE(NULLIF(payload->>'quantidade_blocos','')::int, 1),
    NULLIF(payload->>'quantidade_unidades_total','')::int,
    NULLIF(payload->>'quantidade_elevadores_sociais','')::int,
    CASE WHEN payload ? 'internet_operadoras'
         THEN ARRAY(SELECT jsonb_array_elements_text(payload->'internet_operadoras'))
         ELSE NULL END,
    NULLIF(payload->>'empresa_elevador',''),
    NULLIF(payload->>'elevador_casa_maquinas',''),
    NULLIF(payload->>'tipo_predio',''),
    NULLIF(payload->>'permite_airbnb',''),
    payload->>'sindico_nome',
    payload->>'sindico_cpf',
    payload->>'sindico_whatsapp',
    payload->>'sindico_email',
    NULLIF(payload->>'sindico_mandato_ate','')::date,
    COALESCE(NULLIF(payload->>'aceite_timestamp','')::timestamptz, now()),
    NULLIF(payload->>'aceite_ip',''),
    NULLIF(payload->>'aceite_user_agent',''),
    payload->>'nome_completo',
    payload->>'endereco',
    NULLIF(payload->>'numero_andares','')::int,
    NULLIF(payload->>'numero_unidades','')::int,
    payload->>'email',
    payload->>'celular',
    COALESCE(NULLIF(payload->>'status',''), 'novo')
  )
  RETURNING sindicos_interessados.id, sindicos_interessados.protocolo
  INTO new_id, new_protocolo;

  RETURN QUERY SELECT new_id, new_protocolo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_sindico_interesse(jsonb) TO anon, authenticated;
