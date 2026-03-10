
-- Fix 1: sofia_admin_sessions - 2FA codes exposed publicly
DROP POLICY IF EXISTS "Service role full access to sofia_admin_sessions" ON public.sofia_admin_sessions;

CREATE POLICY "Service role full access to sofia_admin_sessions"
ON public.sofia_admin_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix 2: zapi_logs - customer phone numbers exposed publicly  
DROP POLICY IF EXISTS "Service role can manage zapi logs" ON public.zapi_logs;

CREATE POLICY "Service role can manage zapi logs"
ON public.zapi_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can read zapi logs"
ON public.zapi_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Fix 3: provider_alerts - unauthenticated management
DROP POLICY IF EXISTS "Service role manage provider_alerts" ON public.provider_alerts;

CREATE POLICY "Service role manage provider_alerts"
ON public.provider_alerts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can read provider_alerts"
ON public.provider_alerts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
