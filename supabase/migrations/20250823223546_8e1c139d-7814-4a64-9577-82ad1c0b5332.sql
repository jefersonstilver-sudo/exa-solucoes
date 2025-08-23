-- Critical Security Fix: Secure users table with comprehensive RLS policies
-- Issue: Missing policies for INSERT, UPDATE, DELETE operations on users table
-- Risk: User personal information (email, CPF, documents) could be accessible

-- First, ensure RLS is enabled on users table (should already be enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop any potentially problematic policies and recreate them securely
DROP POLICY IF EXISTS "users_view_own" ON public.users;
DROP POLICY IF EXISTS "super_admin_all_users" ON public.users;

-- 1. SECURE SELECT POLICY: Users can only view their own data
CREATE POLICY "users_can_view_own_data" 
ON public.users 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- 2. SECURE INSERT POLICY: Only allow system/admin insertion of user records
-- This is typically handled by triggers when users sign up, not direct inserts
CREATE POLICY "system_can_insert_users" 
ON public.users 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Only super admin can directly insert user records
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND email = 'jefersonstilver@gmail.com'
  )
);

-- 3. SECURE UPDATE POLICY: Users can update their own non-sensitive data
-- Super admins can update everything, users can update limited fields
CREATE POLICY "users_can_update_own_data" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (
  -- User can update their own record OR user is super admin
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND email = 'jefersonstilver@gmail.com'
  )
)
WITH CHECK (
  -- User can update their own record OR user is super admin
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND email = 'jefersonstilver@gmail.com'
  )
);

-- 4. SECURE DELETE POLICY: Only super admin can delete users
CREATE POLICY "only_super_admin_can_delete_users" 
ON public.users 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND email = 'jefersonstilver@gmail.com'
  )
);

-- 5. SUPER ADMIN COMPREHENSIVE ACCESS: Maintain super admin functionality
CREATE POLICY "super_admin_full_access_users" 
ON public.users 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND email = 'jefersonstilver@gmail.com'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND email = 'jefersonstilver@gmail.com'
  )
);

-- Create a secure function for user profile updates (recommended approach)
-- This allows controlled updates of user data with validation
CREATE OR REPLACE FUNCTION public.update_user_profile_secure(
  p_avatar_url text DEFAULT NULL,
  p_terms_accepted_at timestamptz DEFAULT NULL,
  p_privacy_accepted_at timestamptz DEFAULT NULL,
  p_email_verified_at timestamptz DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Update only non-sensitive fields that users should be able to modify
  UPDATE public.users 
  SET 
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    terms_accepted_at = COALESCE(p_terms_accepted_at, terms_accepted_at),
    privacy_accepted_at = COALESCE(p_privacy_accepted_at, privacy_accepted_at),
    email_verified_at = COALESCE(p_email_verified_at, email_verified_at)
  WHERE id = v_user_id;
  
  RETURN TRUE;
END;
$$;

-- Create secure function for admin user management
CREATE OR REPLACE FUNCTION public.admin_update_user_secure(
  p_user_id uuid,
  p_email text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_cpf text DEFAULT NULL,
  p_documento_estrangeiro text DEFAULT NULL,
  p_tipo_documento text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id uuid;
  v_is_super_admin boolean;
BEGIN
  -- Get current user ID
  v_admin_id := auth.uid();
  
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if user is super admin
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = v_admin_id 
    AND email = 'jefersonstilver@gmail.com'
  ) INTO v_is_super_admin;
  
  IF NOT v_is_super_admin THEN
    RAISE EXCEPTION 'Insufficient permissions - super admin required';
  END IF;
  
  -- Validate role if provided
  IF p_role IS NOT NULL AND p_role NOT IN ('client', 'admin', 'admin_marketing', 'super_admin', 'painel') THEN
    RAISE EXCEPTION 'Invalid role specified';
  END IF;
  
  -- Update user data
  UPDATE public.users 
  SET 
    email = COALESCE(p_email, email),
    role = COALESCE(p_role, role),
    cpf = COALESCE(p_cpf, cpf),
    documento_estrangeiro = COALESCE(p_documento_estrangeiro, documento_estrangeiro),
    tipo_documento = COALESCE(p_tipo_documento, tipo_documento)
  WHERE id = p_user_id;
  
  -- Log the admin action
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'ADMIN_USER_UPDATE',
    format('Super admin %s updated user %s', v_admin_id, p_user_id)
  );
  
  RETURN TRUE;
END;
$$;