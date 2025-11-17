-- Grant necessário para a função acessar as tabelas
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- Recriar is_current_user_super_admin com bypass de RLS
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_has_role_in_user_roles BOOLEAN;
  v_has_role_in_users BOOLEAN;
  v_current_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Se não há usuário autenticado, retornar FALSE
  IF v_current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar na tabela user_roles (ignora RLS por ser SECURITY DEFINER)
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = v_current_user_id 
      AND role = 'super_admin'::app_role
    ) INTO v_has_role_in_user_roles;
  EXCEPTION WHEN OTHERS THEN
    v_has_role_in_user_roles := FALSE;
  END;
  
  -- Verificar na tabela users como fallback (ignora RLS por ser SECURITY DEFINER)
  BEGIN
    SELECT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = v_current_user_id 
      AND role = 'super_admin'
    ) INTO v_has_role_in_users;
  EXCEPTION WHEN OTHERS THEN
    v_has_role_in_users := FALSE;
  END;
  
  RAISE NOTICE '[is_current_user_super_admin] User ID: %, user_roles: %, users: %', 
    v_current_user_id, v_has_role_in_user_roles, v_has_role_in_users;
  
  -- Retornar TRUE se encontrado em qualquer uma das tabelas
  RETURN v_has_role_in_user_roles OR v_has_role_in_users;
END;
$$;