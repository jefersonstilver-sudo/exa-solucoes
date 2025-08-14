-- Fix developer_auth_tokens security - ensure only super admins can access
-- Current issue: Table might be publicly readable despite existing policies

-- First, ensure RLS is enabled on the table
ALTER TABLE public.developer_auth_tokens ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to recreate them securely
DROP POLICY IF EXISTS "Only super admins can manage developer tokens" ON public.developer_auth_tokens;

-- Create a comprehensive policy that restricts ALL access to super admins only
CREATE POLICY "Super admins only access to developer tokens" 
ON public.developer_auth_tokens 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Ensure no other policies exist that could grant broader access
-- Add explicit denial for non-super admin users
CREATE POLICY "Deny access to non-super admins" 
ON public.developer_auth_tokens 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Set the super admin policy to have higher precedence by recreating it last
DROP POLICY IF EXISTS "Super admins only access to developer tokens" ON public.developer_auth_tokens;

CREATE POLICY "Super admins only access to developer tokens" 
ON public.developer_auth_tokens 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Add a comment to document the security requirement
COMMENT ON TABLE public.developer_auth_tokens IS 'SECURITY CRITICAL: Contains authentication token hashes. Access restricted to super_admin role only.';