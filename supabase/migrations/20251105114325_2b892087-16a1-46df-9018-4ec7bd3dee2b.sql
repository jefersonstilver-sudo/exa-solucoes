-- Clean up ALL existing policies on user_sessions and create simple, clear ones
-- Drop ALL existing policies
DROP POLICY IF EXISTS "allow_anyone_insert_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_anyone_update_own_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_anyone_delete_own_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_select_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_anon_select_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_anon_insert_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_all_update_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_all_delete_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Super admins can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_own_sessions_select" ON public.user_sessions;
DROP POLICY IF EXISTS "allow_admin_all_sessions_select" ON public.user_sessions;

-- Create new, simple policies
-- Allow EVERYONE (including anonymous) to INSERT sessions
CREATE POLICY "Enable insert for all users"
ON public.user_sessions
FOR INSERT
WITH CHECK (true);

-- Allow EVERYONE to UPDATE sessions
CREATE POLICY "Enable update for all users"
ON public.user_sessions
FOR UPDATE
USING (true);

-- Allow EVERYONE to DELETE sessions
CREATE POLICY "Enable delete for all users"
ON public.user_sessions
FOR DELETE
USING (true);

-- Allow EVERYONE to SELECT sessions (for real-time monitoring)
CREATE POLICY "Enable select for all users"
ON public.user_sessions
FOR SELECT
USING (true);