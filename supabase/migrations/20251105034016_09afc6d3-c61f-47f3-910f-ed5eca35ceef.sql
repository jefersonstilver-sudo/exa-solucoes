-- Migration: Fix privilege escalation via users.role column
-- This migration creates a secure database view and helper function

-- Step 1: Create a view that reads roles from user_roles table
-- This ensures all role data comes from the authoritative source
CREATE OR REPLACE VIEW public.users_with_role AS
SELECT 
  u.id,
  u.email,
  u.nome,
  u.cpf,
  u.documento_estrangeiro,
  u.documento_frente_url,
  u.documento_verso_url,
  u.avatar_url,
  u.tipo_documento,
  u.telefone,
  u.data_criacao,
  u.terms_accepted_at,
  u.privacy_accepted_at,
  u.email_verified_at,
  COALESCE(ur.role, 'client') as role
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id;

-- Step 2: Grant SELECT access to authenticated users
GRANT SELECT ON public.users_with_role TO authenticated;

-- Step 3: Enable RLS on the view (inherits from base tables)
ALTER VIEW public.users_with_role SET (security_invoker = true);

-- Step 4: Create helper function to get user role securely
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(role::text, 'client')
  FROM public.user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

-- Step 5: Add comment explaining the migration
COMMENT ON VIEW public.users_with_role IS 'Secure view that always reads roles from user_roles table, preventing privilege escalation via users.role column';
COMMENT ON FUNCTION public.get_user_role(uuid) IS 'Secure function to retrieve user role from user_roles table';