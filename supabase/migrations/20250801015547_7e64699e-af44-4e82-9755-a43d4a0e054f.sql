-- Create secure admin function for role updates with proper authorization
CREATE OR REPLACE FUNCTION public.admin_update_user_role_secure(
  p_user_id uuid,
  p_new_role text,
  p_admin_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_admin_role text;
  v_target_user_email text;
  v_old_role text;
  v_result jsonb;
BEGIN
  -- Get admin's role and verify permissions
  SELECT role INTO v_admin_role
  FROM public.users
  WHERE id = p_admin_id;
  
  -- Only super_admin can update roles
  IF v_admin_role != 'super_admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions'
    );
  END IF;
  
  -- Validate new role
  IF p_new_role NOT IN ('client', 'admin', 'admin_marketing', 'super_admin', 'painel') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid role'
    );
  END IF;
  
  -- Get target user info
  SELECT email, role INTO v_target_user_email, v_old_role
  FROM public.users
  WHERE id = p_user_id;
  
  IF v_target_user_email IS NULL THEN
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
  
  -- Update user role
  UPDATE public.users
  SET role = p_new_role
  WHERE id = p_user_id;
  
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
    'user_email', v_target_user_email
  );
  
  RETURN v_result;
END;
$$;

-- Fix search_path in existing functions to prevent SQL injection
CREATE OR REPLACE FUNCTION public.admin_insert_user(user_id uuid, user_email text, user_role text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  inserted_id UUID;
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (user_id, user_email, user_role)
  RETURNING id INTO inserted_id;
  
  RETURN inserted_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_check_user_exists(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE email = user_email
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_get_all_user_ids()
RETURNS uuid[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT array_agg(id) FROM public.users;
$$;

-- Create secure password generation function (no hardcoded passwords)
CREATE OR REPLACE FUNCTION public.generate_secure_temp_password()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_password text;
  v_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  v_length integer := 16;
  i integer;
BEGIN
  v_password := '';
  FOR i IN 1..v_length LOOP
    v_password := v_password || substr(v_chars, floor(random() * length(v_chars) + 1)::integer, 1);
  END LOOP;
  
  RETURN v_password;
END;
$$;