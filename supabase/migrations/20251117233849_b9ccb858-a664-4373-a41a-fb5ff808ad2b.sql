-- Remover as políticas problemáticas e adicionar políticas corretas
DROP POLICY IF EXISTS "Allow user self-access and security definer functions" ON public.users;
DROP POLICY IF EXISTS "Allow role self-access and security definer functions" ON public.user_roles;

-- Política para users: apenas acesso do próprio usuário (SECURITY DEFINER functions não precisam de política)
CREATE POLICY "users_can_view_own_profile"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Política para user_roles: apenas acesso do próprio usuário
CREATE POLICY "users_can_view_own_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Recriar is_current_user_super_admin de forma mais simples e robusta
-- SECURITY DEFINER ignora RLS, então não precisa das políticas complexas
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_user_id UUID;
  v_is_super_admin BOOLEAN;
BEGIN
  -- Pegar ID do usuário atual
  v_user_id := auth.uid();
  
  -- Se não há usuário (NULL), não é super admin
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar diretamente na tabela users
  -- SECURITY DEFINER permite bypass de RLS
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = v_user_id 
    AND role = 'super_admin'
  ) INTO v_is_super_admin;
  
  -- Se encontrou na users, retornar
  IF v_is_super_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Tentar em user_roles como fallback
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_user_id 
    AND role = 'super_admin'::app_role
  ) INTO v_is_super_admin;
  
  RETURN COALESCE(v_is_super_admin, FALSE);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, log e retornar FALSE
    RAISE NOTICE 'Error in is_current_user_super_admin: % %', SQLSTATE, SQLERRM;
    RETURN FALSE;
END;
$$;

-- Testar a função
DO $$
DECLARE
  v_test_result BOOLEAN;
BEGIN
  -- Simular como se fosse chamado com um usuário super admin
  RAISE NOTICE 'Testing is_current_user_super_admin function...';
  -- Função será testada quando um usuário real fizer login
END $$;