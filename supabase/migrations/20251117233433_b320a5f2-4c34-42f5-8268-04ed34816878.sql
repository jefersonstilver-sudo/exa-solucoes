-- Adicionar política RLS que permite que funções SECURITY DEFINER acessem dados do usuário
-- Isso é necessário para is_current_user_super_admin() funcionar
DROP POLICY IF EXISTS "Users can see their own role" ON public.users;
DROP POLICY IF EXISTS "Users can see their own roles" ON public.user_roles;

-- Política para users: permite que o próprio usuário veja seus dados
-- E permite que funções SECURITY DEFINER acessem qualquer usuário
CREATE POLICY "Allow user self-access and security definer functions"
ON public.users
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  -- Permitir acesso via funções SECURITY DEFINER
  current_setting('role', true) = 'authenticator'
);

-- Política para user_roles: mesma lógica
CREATE POLICY "Allow role self-access and security definer functions"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  -- Permitir acesso via funções SECURITY DEFINER
  current_setting('role', true) = 'authenticator'
);

-- Simplificar is_current_user_super_admin para garantir que funciona
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Verificar em users primeiro
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
  OR
  -- Fallback para user_roles
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'::app_role
  );
$$;