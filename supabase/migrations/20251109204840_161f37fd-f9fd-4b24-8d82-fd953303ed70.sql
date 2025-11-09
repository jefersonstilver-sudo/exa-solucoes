-- Recriar a view users_with_last_access com SECURITY DEFINER
-- para que ela execute com privilégios do owner, não do usuário que a acessa

-- Dropar a view existente
DROP VIEW IF EXISTS users_with_last_access;

-- Recriar como função SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_users_with_last_access()
RETURNS TABLE (
  id uuid,
  data_criacao timestamp with time zone,
  email_verified_at timestamp with time zone,
  terms_accepted_at timestamp with time zone,
  privacy_accepted_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  email_confirmed_at timestamp with time zone,
  raw_user_meta_data jsonb,
  last_access_at timestamp with time zone,
  email text,
  nome text,
  cpf text,
  telefone text,
  avatar_url text,
  role text,
  documento_estrangeiro text,
  documento_frente_url text,
  documento_verso_url text,
  tipo_documento text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.data_criacao,
    u.email_verified_at,
    u.terms_accepted_at,
    u.privacy_accepted_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    au.raw_user_meta_data,
    au.last_sign_in_at as last_access_at,
    u.email,
    u.nome,
    u.cpf,
    u.telefone,
    u.avatar_url,
    u.role,
    u.documento_estrangeiro,
    u.documento_frente_url,
    u.documento_verso_url,
    u.tipo_documento
  FROM users u
  LEFT JOIN auth.users au ON au.id = u.id;
END;
$$;

-- Comentário
COMMENT ON FUNCTION get_users_with_last_access() IS 
'Retorna todos os usuários com informações de último acesso. Usa SECURITY DEFINER para admins acessarem.';