-- Fix privilege escalation vulnerability in admin_update_user_role_secure
-- This function should update user_roles table, not users.role directly

DROP FUNCTION IF EXISTS public.admin_update_user_role_secure(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.admin_update_user_role_secure(
  p_admin_id uuid,
  p_user_id uuid,
  p_new_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_role text;
  v_old_role text;
  v_result jsonb;
BEGIN
  -- Check if admin exists and get their role
  SELECT role INTO v_admin_role
  FROM public.users
  WHERE id = p_admin_id;
  
  IF v_admin_role IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Admin user not found'
    );
  END IF;
  
  -- Only super_admin can change roles
  IF v_admin_role != 'super_admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions'
    );
  END IF;
  
  -- Validate new role
  IF p_new_role NOT IN ('super_admin', 'admin', 'admin_marketing', 'client', 'painel') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid role'
    );
  END IF;
  
  -- Get current role from user_roles table (or users table as fallback)
  SELECT role INTO v_old_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
  
  -- If not found in user_roles, check users table
  IF v_old_role IS NULL THEN
    SELECT role INTO v_old_role
    FROM public.users
    WHERE id = p_user_id;
  END IF;
  
  IF v_old_role IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- Prevent super_admin demotion (except self)
  IF v_old_role = 'super_admin' AND p_new_role != 'super_admin' AND p_user_id != p_admin_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot demote super_admin'
    );
  END IF;
  
  -- Delete old role from user_roles
  DELETE FROM public.user_roles
  WHERE user_id = p_user_id;
  
  -- Insert new role into user_roles (the trigger will sync to users table)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_new_role::app_role);
  
  -- Log the role change
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'ADMIN_ROLE_UPDATE',
    format('Admin %s updated user %s role from %s to %s', 
           p_admin_id, p_user_id, v_old_role, p_new_role)
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'old_role', v_old_role,
    'new_role', p_new_role,
    'updated_at', now()
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users (function will check permissions internally)
GRANT EXECUTE ON FUNCTION public.admin_update_user_role_secure(uuid, uuid, text) TO authenticated;