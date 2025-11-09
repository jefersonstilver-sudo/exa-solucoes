-- Security Fix: Restrict access to users_with_last_access view
-- This fixes the critical vulnerability where all authenticated users
-- could see sensitive auth data for all other users

-- 1. Revoke broad access from authenticated users
REVOKE SELECT ON public.users_with_last_access FROM authenticated;

-- 2. Enable RLS on the view by setting security_invoker
-- This makes the view use the caller's permissions instead of the definer's
ALTER VIEW public.users_with_last_access SET (security_invoker = true);

-- 3. Create RLS policy: users can only see their own data, or admins can see all
-- First, we need to enable RLS on a base table that backs policies
-- Since this is a view, we'll grant controlled access via a policy-like function

-- 4. Create a secure function to query the view with proper access control
CREATE OR REPLACE FUNCTION public.get_user_with_last_access(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  email text,
  nome text,
  cpf text,
  telefone text,
  avatar_url text,
  role text,
  data_criacao timestamp with time zone,
  email_verified_at timestamp with time zone,
  terms_accepted_at timestamp with time zone,
  privacy_accepted_at timestamp with time zone,
  documento_estrangeiro text,
  documento_frente_url text,
  documento_verso_url text,
  tipo_documento text,
  last_sign_in_at timestamp with time zone,
  email_confirmed_at timestamp with time zone,
  raw_user_meta_data jsonb,
  last_access_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    uwla.id,
    uwla.email,
    uwla.nome,
    uwla.cpf,
    uwla.telefone,
    uwla.avatar_url,
    uwla.role,
    uwla.data_criacao,
    uwla.email_verified_at,
    uwla.terms_accepted_at,
    uwla.privacy_accepted_at,
    uwla.documento_estrangeiro,
    uwla.documento_frente_url,
    uwla.documento_verso_url,
    uwla.tipo_documento,
    uwla.last_sign_in_at,
    uwla.email_confirmed_at,
    uwla.raw_user_meta_data,
    uwla.last_access_at
  FROM public.users_with_last_access uwla
  WHERE 
    -- User can see their own data
    (target_user_id IS NULL AND uwla.id = auth.uid())
    OR (target_user_id IS NOT NULL AND uwla.id = target_user_id AND uwla.id = auth.uid())
    -- OR admins/super_admins can see any user's data
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin', 'admin_marketing', 'admin_financeiro')
    );
$$;

-- 5. Grant execute permission to authenticated users for the secure function
GRANT EXECUTE ON FUNCTION public.get_user_with_last_access(uuid) TO authenticated;

-- 6. Comment the changes
COMMENT ON FUNCTION public.get_user_with_last_access IS 'Secure function to access user data with last access info. Users can only see their own data, admins can see all users. This replaces direct view access to prevent auth.users data exposure.';