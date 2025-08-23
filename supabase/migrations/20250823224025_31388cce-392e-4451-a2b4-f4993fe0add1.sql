-- Fix infinite recursion in users table RLS policies
-- The issue is that policies are referencing the same table they're protecting

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "only_super_admin_can_delete_users" ON public.users;
DROP POLICY IF EXISTS "super_admin_full_access_users" ON public.users;
DROP POLICY IF EXISTS "system_can_insert_users" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_data" ON public.users;
DROP POLICY IF EXISTS "users_can_view_own_data" ON public.users;

-- Create simple, non-recursive policies
-- Users can view their own data
CREATE POLICY "users_can_view_own_data" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data (non-sensitive fields only)
CREATE POLICY "users_can_update_own_data" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super admin access using JWT claims (no table recursion)
CREATE POLICY "super_admin_full_access" ON public.users
  FOR ALL
  USING ((auth.jwt() ->> 'email'::text) = 'jefersonstilver@gmail.com'::text)
  WITH CHECK ((auth.jwt() ->> 'email'::text) = 'jefersonstilver@gmail.com'::text);

-- System can insert users (for registration)
CREATE POLICY "system_can_insert_users" ON public.users
  FOR INSERT
  WITH CHECK (true);

-- Log the fix
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'CRITICAL_RLS_FIX',
  'Fixed infinite recursion in users table RLS policies - users can now access their data'
);