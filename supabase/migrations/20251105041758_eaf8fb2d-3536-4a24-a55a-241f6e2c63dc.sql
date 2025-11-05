-- Função auxiliar para verificar se é admin sem causar recursão
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id
    AND role IN ('admin', 'super_admin')
  );
$$;

-- Remover todas as políticas antigas de user_sessions
DROP POLICY IF EXISTS "users_can_view_own_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "users_can_create_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "users_can_update_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "users_can_delete_own_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "admins_can_view_all_sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Permitir leitura de sessões próprias" ON public.user_sessions;
DROP POLICY IF EXISTS "Permitir inserção de sessões próprias" ON public.user_sessions;
DROP POLICY IF EXISTS "Permitir atualização de sessões próprias" ON public.user_sessions;
DROP POLICY IF EXISTS "Permitir deleção de sessões próprias" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins podem ver todas as sessões" ON public.user_sessions;

-- Políticas simples e sem recursão
CREATE POLICY "allow_anon_insert_sessions"
ON public.user_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "allow_all_update_sessions"
ON public.user_sessions
FOR UPDATE
TO anon, authenticated
USING (true);

CREATE POLICY "allow_all_delete_sessions"
ON public.user_sessions
FOR DELETE
TO anon, authenticated
USING (true);

CREATE POLICY "allow_own_sessions_select"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "allow_admin_all_sessions_select"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (public.is_user_admin(auth.uid()));