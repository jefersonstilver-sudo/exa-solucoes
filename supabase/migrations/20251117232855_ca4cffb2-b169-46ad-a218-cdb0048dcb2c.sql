-- Corrigir is_current_user_super_admin para verificar na tabela user_roles E users
-- O sistema híbrido: user_roles tem precedência, mas fallback para users.role
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_role_in_user_roles BOOLEAN;
  v_has_role_in_users BOOLEAN;
  v_current_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Verificar se é NULL (usuário não autenticado)
  IF v_current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar na tabela user_roles primeiro (sistema novo)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_current_user_id 
    AND role = 'super_admin'::app_role
  ) INTO v_has_role_in_user_roles;
  
  -- Verificar na tabela users como fallback (sistema legado)
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = v_current_user_id 
    AND role = 'super_admin'
  ) INTO v_has_role_in_users;
  
  RAISE NOTICE '[is_current_user_super_admin] User ID: %, user_roles: %, users: %', 
    v_current_user_id, v_has_role_in_user_roles, v_has_role_in_users;
  
  -- Retornar TRUE se encontrado em qualquer uma das tabelas
  RETURN v_has_role_in_user_roles OR v_has_role_in_users;
END;
$$;