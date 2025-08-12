-- Secure painels table: remove public access and restrict to admins; keep functionality via RPC
-- 1) Drop overly permissive/public policies
DROP POLICY IF EXISTS "Users can view panels" ON public.painels;
DROP POLICY IF EXISTS "panels_select_policy" ON public.painels;
DROP POLICY IF EXISTS "Authenticated view painels" ON public.painels;
DROP POLICY IF EXISTS "Users can update panel assignments" ON public.painels;

-- 2) Create a strict SELECT policy for admins/super_admins only
CREATE POLICY "admins_can_view_painels_sensitive"
ON public.painels
FOR SELECT
USING (is_admin_user());

-- (Existing policies retained)
-- panels_insert_policy: INSERT WITH CHECK is_admin_user()
-- panels_update_policy: UPDATE USING is_admin_user() WITH CHECK is_admin_user()
-- panels_delete_policy: DELETE USING is_super_admin_user()

-- 3) Ensure the location RPC keeps working for public/client contexts without exposing sensitive columns
--    Make it SECURITY DEFINER so it bypasses RLS while returning only non-sensitive fields
ALTER FUNCTION public.get_panels_by_location(double precision, double precision, double precision)
  SECURITY DEFINER;

-- 4) Explicitly grant execute on the RPC to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_panels_by_location(double precision, double precision, double precision)
  TO anon, authenticated;

-- Notes:
-- - Sensitive columns (codigo_anydesk, senha_anydesk, ip_interno, mac_address, sistema_operacional, etc.)
--   are now protected because direct SELECT from public.painels is restricted to admins only.
-- - The get_panels_by_location function returns only a safe subset of columns and remains available
--   to public/authenticated clients without requiring table access.
