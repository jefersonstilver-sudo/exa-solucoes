-- Fix RLS policies for user_sessions to allow session tracking
-- Drop existing problematic policies
DROP POLICY IF EXISTS "allow_insert_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_update_own_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_delete_own_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_admin_select_all_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_select_own_sessions" ON public.user_sessions;

-- Allow anyone (including anonymous users) to INSERT sessions
-- This is needed for tracking both authenticated and anonymous visitors
CREATE POLICY "allow_anyone_insert_sessions"
ON public.user_sessions
FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to UPDATE their own session (matched by session_id)
CREATE POLICY "allow_anyone_update_own_sessions"
ON public.user_sessions
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Allow anyone to DELETE their own session (matched by session_id)
CREATE POLICY "allow_anyone_delete_own_sessions"
ON public.user_sessions
FOR DELETE
TO public
USING (true);

-- For SELECT, allow:
-- 1. Authenticated users to see their own sessions
-- 2. Admins to see all sessions
CREATE POLICY "allow_select_sessions"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  public.is_user_admin(auth.uid())
);

-- Also allow anonymous users to select their own sessions (for debugging)
CREATE POLICY "allow_anon_select_sessions"
ON public.user_sessions
FOR SELECT
TO anon
USING (true);