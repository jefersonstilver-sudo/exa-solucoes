
-- Fix mp_transactions_cache: drop public ALL policy, add service_role only
DROP POLICY IF EXISTS "System can manage MP transactions cache" ON public.mp_transactions_cache;

CREATE POLICY "Service role can manage MP transactions cache"
ON public.mp_transactions_cache
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated admins can read MP transactions cache"
ON public.mp_transactions_cache
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix sofia_admin_access_logs: drop public ALL policy, add service_role only
DROP POLICY IF EXISTS "Service role full access to sofia_admin_access_logs" ON public.sofia_admin_access_logs;

CREATE POLICY "Service role full access sofia_admin_access_logs"
ON public.sofia_admin_access_logs
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can read sofia_admin_access_logs"
ON public.sofia_admin_access_logs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
