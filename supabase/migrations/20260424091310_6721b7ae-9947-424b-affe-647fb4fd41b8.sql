-- 1. Adicionar 3 colunas em sindicos_interessados para registrar verificação 2FA do WhatsApp
ALTER TABLE public.sindicos_interessados
  ADD COLUMN IF NOT EXISTS whatsapp_verificado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_verificado_em timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_verification_session_id text;

-- 2. Atualizar RPC submit_sindico_interesse:
--    a) gravar os 3 novos campos
--    b) validar server-side que existe verificação OTP confirmada para o session_id + telefone
CREATE OR REPLACE FUNCTION public.submit_sindico_interesse(payload jsonb)
RETURNS TABLE(id uuid, protocolo text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
  new_protocolo text;
  v_session_id text := NULLIF(payload->>'whatsapp_verification_session_id','');
  v_telefone   text := payload->>'sindico_whatsapp';
  v_verificado boolean := COALESCE((payload->>'whatsapp_verificado')::boolean, false);
  v_existe_otp boolean;
BEGIN
  -- Defesa em profundidade: se o cliente diz que verificou, confirmamos no servidor.
  IF v_verificado THEN
    IF v_session_id IS NULL THEN
      RAISE EXCEPTION 'WHATSAPP_NAO_VERIFICADO: session_id ausente';
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.exa_alerts_verification_codes
      WHERE session_id = v_session_id
        AND telefone = v_telefone
        AND verificado = true
        AND created_at > now() - interval '1 hour'
    ) INTO v_existe_otp;

    IF NOT v_existe_otp THEN
      RAISE EXCEPTION 'WHATSAPP_NAO_VERIFICADO: nenhum código OTP confirmado encontrado para este número';
    END IF;
  ELSE
    -- Política: verificação obrigatória.
    RAISE EXCEPTION 'WHATSAPP_NAO_VERIFICADO: o WhatsApp do síndico precisa ser verificado por código antes do envio';
  END IF;

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
    status,
    whatsapp_verificado,
    whatsapp_verificado_em,
    whatsapp_verification_session_id
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
    COALESCE(NULLIF(payload->>'status',''), 'novo'),
    true,
    COALESCE(NULLIF(payload->>'whatsapp_verificado_em','')::timestamptz, now()),
    v_session_id
  )
  RETURNING sindicos_interessados.id, sindicos_interessados.protocolo
  INTO new_id, new_protocolo;

  RETURN QUERY SELECT new_id, new_protocolo;
END;
$function$;