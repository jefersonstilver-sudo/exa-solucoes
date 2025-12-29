-- Remover políticas antigas e conflitantes de user_sessions
DROP POLICY IF EXISTS "Enable delete for all users" ON public.user_sessions;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.user_sessions;
DROP POLICY IF EXISTS "Enable select for all users" ON public.user_sessions;
DROP POLICY IF EXISTS "Enable update for all users" ON public.user_sessions;

-- Também remover as políticas antigas com nomes antigos se existirem
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_sessions;

-- Recriar as políticas seguras caso tenham sido removidas
DROP POLICY IF EXISTS "Users can view own sessions securely" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions securely" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions securely" ON public.user_sessions;
DROP POLICY IF EXISTS "Only super_admin can delete sessions" ON public.user_sessions;

-- Criar políticas seguras
CREATE POLICY "Users can view own sessions securely"
ON public.user_sessions FOR SELECT
USING (user_id = auth.uid() OR is_super_admin_for_sessions());

CREATE POLICY "Users can insert own sessions securely"
ON public.user_sessions FOR INSERT
WITH CHECK (user_id = auth.uid() OR user_id IS NULL OR is_super_admin_for_sessions());

CREATE POLICY "Users can update own sessions securely"
ON public.user_sessions FOR UPDATE
USING (user_id = auth.uid() OR is_super_admin_for_sessions())
WITH CHECK (user_id = auth.uid() OR is_super_admin_for_sessions());

CREATE POLICY "Only super_admin can delete sessions"
ON public.user_sessions FOR DELETE
USING (is_super_admin_for_sessions());