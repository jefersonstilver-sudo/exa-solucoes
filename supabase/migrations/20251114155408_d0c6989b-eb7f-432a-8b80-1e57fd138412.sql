-- Criar função para sincronizar auth.users com public.users
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Extrair role do metadata (padrão: 'client')
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');

  -- Inserir na tabela users
  INSERT INTO public.users (
    id,
    email,
    nome,
    cpf,
    telefone,
    role,
    data_criacao,
    email_verified_at,
    tipo_documento
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'document',
    NEW.raw_user_meta_data->>'phone',
    user_role,
    NOW(),
    CASE 
      WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at
      ELSE NULL
    END,
    COALESCE(NEW.raw_user_meta_data->>'documentType', 'cpf')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = COALESCE(EXCLUDED.nome, users.nome),
    email_verified_at = CASE 
      WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at
      ELSE users.email_verified_at
    END;

  -- Criar role do usuário na tabela user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Criar trigger na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

-- Criar função para atualizar email_verified_at quando confirmado
CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar email_verified_at quando email for confirmado
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.users
    SET email_verified_at = NEW.email_confirmed_at
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger para atualizar confirmação de email
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE FUNCTION public.handle_auth_user_updated();