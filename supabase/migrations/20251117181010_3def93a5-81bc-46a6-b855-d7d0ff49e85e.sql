-- =====================================================
-- FIX: Unificar triggers para popular users E profiles
-- Corrigir sincronização de dados do usuário
-- =====================================================

-- 1. Criar função unificada que popula AMBAS as tabelas
CREATE OR REPLACE FUNCTION public.handle_auth_user_created_unified()
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

  -- 1. Inserir na tabela USERS (principal)
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
    telefone = COALESCE(EXCLUDED.telefone, users.telefone),
    email_verified_at = CASE 
      WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at
      ELSE users.email_verified_at
    END;

  -- 2. Inserir na tabela PROFILES (compatibilidade)
  INSERT INTO public.profiles (
    id,
    full_name,
    phone
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone);

  -- 3. Criar role do usuário na tabela user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Substituir trigger para usar função unificada
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created_unified();

-- 3. MIGRAR DADOS EXISTENTES do user_metadata para users
UPDATE public.users u
SET 
  nome = COALESCE(u.nome, (
    SELECT au.raw_user_meta_data->>'name'
    FROM auth.users au 
    WHERE au.id = u.id
  )),
  telefone = COALESCE(u.telefone, (
    SELECT au.raw_user_meta_data->>'phone'
    FROM auth.users au 
    WHERE au.id = u.id
  ))
WHERE u.nome IS NULL OR u.telefone IS NULL;

-- 4. SINCRONIZAR dados de users para profiles
INSERT INTO public.profiles (id, full_name, phone)
SELECT 
  u.id,
  u.nome,
  u.telefone
FROM public.users u
ON CONFLICT (id) DO UPDATE SET
  full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
  phone = COALESCE(profiles.phone, EXCLUDED.phone);

-- 5. Garantir políticas RLS para UPDATE na tabela users
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Garantir política RLS para SELECT na tabela users
DROP POLICY IF EXISTS "users_view_own" ON public.users;
CREATE POLICY "users_view_own"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- 7. Comentário explicativo
COMMENT ON FUNCTION public.handle_auth_user_created_unified() IS 
'Função unificada que popula tanto users quanto profiles quando novo usuário é criado. Resolve conflito entre migrações antigas.';