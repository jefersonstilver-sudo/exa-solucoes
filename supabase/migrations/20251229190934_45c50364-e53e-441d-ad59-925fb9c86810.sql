-- =====================================================
-- SECURITY FIX: Create helper function first
-- =====================================================

-- Create helper function to check if user is super_admin (security definer)
CREATE OR REPLACE FUNCTION public.is_super_admin_for_sessions()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
$$;

-- =====================================================
-- SECURITY FIX: Secure RLS policies for user_sessions
-- =====================================================

-- Drop existing insecure policies
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Super admins can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view own sessions securely" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions securely" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions securely" ON public.user_sessions;
DROP POLICY IF EXISTS "Only super_admin can delete sessions" ON public.user_sessions;

-- Add columns if they don't exist
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terminated_by UUID;

-- SECURE POLICIES

-- 1. SELECT: Users see only their own sessions, super_admin sees all
CREATE POLICY "Users can view own sessions securely"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_super_admin_for_sessions()
);

-- 2. INSERT: Users can only insert sessions for themselves
CREATE POLICY "Users can insert own sessions securely"
ON public.user_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  OR user_id IS NULL
  OR public.is_super_admin_for_sessions()
);

-- 3. UPDATE: Users can only update their own sessions, super_admin can update all
CREATE POLICY "Users can update own sessions securely"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_super_admin_for_sessions()
)
WITH CHECK (
  user_id = auth.uid() 
  OR public.is_super_admin_for_sessions()
);

-- 4. DELETE: Only super_admin can delete sessions
CREATE POLICY "Only super_admin can delete sessions"
ON public.user_sessions
FOR DELETE
TO authenticated
USING (
  public.is_super_admin_for_sessions()
);

-- =====================================================
-- SECURITY FIX: session_navigation_history RLS
-- =====================================================

-- Ensure RLS is enabled
ALTER TABLE public.session_navigation_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Super admin can view all navigation history" ON public.session_navigation_history;
DROP POLICY IF EXISTS "Users can view own navigation history" ON public.session_navigation_history;
DROP POLICY IF EXISTS "Users can insert own navigation history" ON public.session_navigation_history;
DROP POLICY IF EXISTS "Anyone can insert navigation history" ON public.session_navigation_history;
DROP POLICY IF EXISTS "Anonymous can insert navigation" ON public.session_navigation_history;
DROP POLICY IF EXISTS "Only super_admin can delete navigation" ON public.session_navigation_history;
DROP POLICY IF EXISTS "Users can view own navigation securely" ON public.session_navigation_history;

-- 1. SELECT: Users see only their own navigation, super_admin sees all
CREATE POLICY "Users can view own navigation securely"
ON public.session_navigation_history
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.is_super_admin_for_sessions()
);

-- 2. INSERT: Anyone authenticated can insert (for tracking)
CREATE POLICY "Anyone can insert navigation history"
ON public.session_navigation_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Allow anonymous inserts for non-logged users
CREATE POLICY "Anonymous can insert navigation"
ON public.session_navigation_history
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- 4. DELETE: Only super_admin (for retention cleanup)
CREATE POLICY "Only super_admin can delete navigation"
ON public.session_navigation_history
FOR DELETE
TO authenticated
USING (
  public.is_super_admin_for_sessions()
);

-- Log the security fix
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'SECURITY_FIX_APPLIED',
  'Fixed critical RLS vulnerability in user_sessions and session_navigation_history tables. Policies now properly restrict access.'
);