-- Tighten INSERT policy to prevent abuse
DROP POLICY IF EXISTS "system_can_insert_users" ON public.users;

-- Only allow users to insert their own row (service role bypasses RLS if needed)
CREATE POLICY "users_can_insert_own" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Log tightening
INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
VALUES ('RLS_HARDENING', 'Restricted users INSERT to own row on public.users');