-- Fix search_path security issues in database functions
-- Update all security definer functions to use secure search_path

-- Fix generate_developer_token function
CREATE OR REPLACE FUNCTION public.generate_developer_token()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_token TEXT;
  v_token_hash TEXT;
BEGIN
  -- Only super admins can generate tokens
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only super admins can generate developer tokens';
  END IF;
  
  -- Generate secure random token
  v_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');
  
  -- Store hash (expires in 24 hours)
  INSERT INTO public.developer_auth_tokens (token_hash, expires_at)
  VALUES (v_token_hash, now() + interval '24 hours');
  
  -- Return the actual token (only time it's shown)
  RETURN v_token;
END;
$function$;

-- Fix validate_developer_token function
CREATE OR REPLACE FUNCTION public.validate_developer_token(p_token text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_token_hash TEXT;
BEGIN
  v_token_hash := encode(digest(p_token, 'sha256'), 'hex');
  
  RETURN EXISTS (
    SELECT 1 FROM public.developer_auth_tokens
    WHERE token_hash = v_token_hash
    AND expires_at > now()
    AND is_active = true
  );
END;
$function$;

-- Fix admin_update_user_role_secure function
CREATE OR REPLACE FUNCTION public.admin_update_user_role_secure(p_user_id uuid, p_new_role text, p_admin_id uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;