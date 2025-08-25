-- Drop the problematic policy first
DROP POLICY IF EXISTS "admins_can_select_all_users" ON public.users;

-- Create a security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users au
    JOIN public.users u ON u.id = au.id
    WHERE au.id = auth.uid()
    AND u.role IN ('admin', 'super_admin')
  );
$$;

-- Create the correct RLS policy using the security definer function
CREATE POLICY "admins_can_select_all_users" 
ON public.users 
FOR SELECT 
USING (is_admin_user());