-- =====================================================
-- CORREÇÃO COMPLETA: TRIGGERS E SINCRONIZAÇÃO DE USUÁRIOS
-- =====================================================

-- FASE 1: REABILITAR TRIGGERS (eram desabilitados)
-- Dropar triggers existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Recriar triggers HABILITADOS (enabled = 'A')
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_auth_user_created();

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_auth_user_updated();

-- FASE 2: CORRIGIR DADOS EXISTENTES
-- Inserir usuários que existem em auth.users mas não em public.users
INSERT INTO public.users (
  id,
  email,
  nome,
  role,
  email_verified_at,
  data_criacao
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email),
  COALESCE(au.raw_user_meta_data->>'role', 'client'),
  au.email_confirmed_at,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Criar roles para usuários que não têm
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  CASE 
    WHEN u.role = 'super_admin' THEN 'super_admin'::app_role
    WHEN u.role = 'admin' THEN 'admin'::app_role
    WHEN u.role = 'admin_marketing' THEN 'admin_marketing'::app_role
    ELSE 'client'::app_role
  END
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- FASE 3: CRIAR FUNÇÃO DE SINCRONIZAÇÃO MANUAL (fallback)
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public(auth_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_name TEXT;
  v_role TEXT;
  v_email_confirmed_at TIMESTAMPTZ;
  v_created_at TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  -- Buscar dados do auth.users
  SELECT 
    email,
    COALESCE(raw_user_meta_data->>'name', email),
    COALESCE(raw_user_meta_data->>'role', 'client'),
    email_confirmed_at,
    created_at
  INTO 
    v_email,
    v_name,
    v_role,
    v_email_confirmed_at,
    v_created_at
  FROM auth.users
  WHERE id = auth_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found in auth.users'
    );
  END IF;

  -- Inserir em public.users
  INSERT INTO public.users (
    id,
    email,
    nome,
    role,
    email_verified_at,
    data_criacao
  ) VALUES (
    auth_user_id,
    v_email,
    v_name,
    v_role,
    v_email_confirmed_at,
    v_created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = EXCLUDED.nome,
    role = EXCLUDED.role,
    email_verified_at = EXCLUDED.email_verified_at;

  -- Inserir role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    auth_user_id,
    CASE 
      WHEN v_role = 'super_admin' THEN 'super_admin'::app_role
      WHEN v_role = 'admin' THEN 'admin'::app_role
      WHEN v_role = 'admin_marketing' THEN 'admin_marketing'::app_role
      ELSE 'client'::app_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  v_result := jsonb_build_object(
    'success', true,
    'user_id', auth_user_id,
    'email', v_email,
    'role', v_role
  );

  RETURN v_result;
END;
$$;