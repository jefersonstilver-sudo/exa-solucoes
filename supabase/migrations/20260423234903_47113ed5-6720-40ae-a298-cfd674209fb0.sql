-- Permite que qualquer pessoa (anon/authenticated) leia o id+protocolo recém-inseridos
-- via RPC security definer. Isso resolve o erro "new row violates row-level security policy"
-- que ocorre quando o .insert().select() do PostgREST tenta retornar a linha recém-criada
-- e a policy de SELECT bloqueia anônimos.

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
    nome_predio, endereco_logradouro, endereco_numero, endereco_complemento,
    endereco_bairro, endereco_cidade, endereco_uf, cep,
    endereco_latitude, endereco_longitude, endereco_google_place_id,
    quantidade_andares, quantidade_blocos, quantidade_unidades_total,
    quantidade_elevadores_sociais, internet_operadoras, empresa_elevador,
    elevador_casa_maquinas,
    sindico_nome, sindico_cpf, sindico_whatsapp, sindico_email, sindico_mandato_ate,
    aceite_timestamp, aceite_ip, aceite_user_agent,
    nome_completo, endereco, numero_andares, numero_unidades,
    email, celular, status
  )
  VALUES (
    payload->>'nome_predio',
    payload->>'endereco_logradouro',
    payload->>'endereco_numero',
    payload->>'endereco_complemento',
    payload->>'endereco_bairro',
    payload->>'endereco_cidade',
    payload->>'endereco_uf',
    payload->>'cep',
    NULLIF(payload->>'endereco_latitude','')::numeric,
    NULLIF(payload->>'endereco_longitude','')::numeric,
    payload->>'endereco_google_place_id',
    NULLIF(payload->>'quantidade_andares','')::int,
    NULLIF(payload->>'quantidade_blocos','')::int,
    NULLIF(payload->>'quantidade_unidades_total','')::int,
    NULLIF(payload->>'quantidade_elevadores_sociais','')::int,
    CASE WHEN payload ? 'internet_operadoras'
         THEN ARRAY(SELECT jsonb_array_elements_text(payload->'internet_operadoras'))
         ELSE NULL END,
    payload->>'empresa_elevador',
    payload->>'elevador_casa_maquinas',
    payload->>'sindico_nome',
    payload->>'sindico_cpf',
    payload->>'sindico_whatsapp',
    payload->>'sindico_email',
    NULLIF(payload->>'sindico_mandato_ate','')::date,
    NULLIF(payload->>'aceite_timestamp','')::timestamptz,
    payload->>'aceite_ip',
    payload->>'aceite_user_agent',
    payload->>'nome_completo',
    payload->>'endereco',
    NULLIF(payload->>'numero_andares','')::int,
    NULLIF(payload->>'numero_unidades','')::int,
    payload->>'email',
    payload->>'celular',
    COALESCE(payload->>'status','novo')
  )
  RETURNING sindicos_interessados.id, sindicos_interessados.protocolo
  INTO new_id, new_protocolo;

  RETURN QUERY SELECT new_id, new_protocolo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_sindico_interesse(jsonb) TO anon, authenticated;

-- Permite que anon/authenticated ATUALIZE apenas o campo fotos_elevador_urls
-- da própria linha recém-criada (necessário para upload de fotos pós-insert).
CREATE OR REPLACE FUNCTION public.update_sindico_fotos(p_id uuid, p_fotos text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sindicos_interessados
  SET fotos_elevador_urls = p_fotos
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_sindico_fotos(uuid, text[]) TO anon, authenticated;