-- Fix: Allow authenticated users to UPDATE devices
-- Required for soft delete functionality from admin interface

-- Drop existing restrictive policy if exists
DROP POLICY IF EXISTS "Service role only access" ON public.devices;

-- Recreate service role full access
CREATE POLICY "Service role full access"
ON public.devices
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to UPDATE devices (for soft delete, alert configs, etc)
CREATE POLICY "Authenticated users can update devices"
ON public.devices
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);