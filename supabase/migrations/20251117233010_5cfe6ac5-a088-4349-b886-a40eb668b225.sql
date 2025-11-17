-- Adicionar política RLS para permitir que usuários autenticados vejam seu próprio role
CREATE POLICY "Users can see their own role" ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Adicionar política RLS para user_roles
CREATE POLICY "Users can see their own roles" ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());