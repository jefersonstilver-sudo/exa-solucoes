-- Criar função security definer para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$;

-- Recriar as políticas usando a função security definer
DROP POLICY IF EXISTS "Admins can view all contact types" ON contact_types;
DROP POLICY IF EXISTS "Admins can insert custom contact types" ON contact_types;
DROP POLICY IF EXISTS "Admins can update custom contact types" ON contact_types;
DROP POLICY IF EXISTS "Admins can delete custom contact types" ON contact_types;

-- Política de SELECT: todos usuários autenticados podem ver
CREATE POLICY "All authenticated users can view contact types"
  ON contact_types FOR SELECT
  TO authenticated
  USING (true);

-- Política de INSERT: apenas admins podem criar tipos customizados
CREATE POLICY "Admins can insert custom contact types"
  ON contact_types FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_user() = true
    AND is_default = false
  );

-- Política de UPDATE: apenas admins podem atualizar tipos não-default
CREATE POLICY "Admins can update custom contact types"
  ON contact_types FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_user() = true
    AND is_default = false
  )
  WITH CHECK (
    is_default = false
  );

-- Política de DELETE: apenas admins podem deletar tipos não-default
CREATE POLICY "Admins can delete custom contact types"
  ON contact_types FOR DELETE
  TO authenticated
  USING (
    public.is_admin_user() = true
    AND is_default = false
  );