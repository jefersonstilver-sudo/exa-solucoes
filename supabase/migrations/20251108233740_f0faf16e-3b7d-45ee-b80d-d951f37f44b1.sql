-- Atualizar política RLS para permitir que admins também possam atualizar roles
-- Remove a política restritiva antiga
DROP POLICY IF EXISTS "Block direct role updates" ON public.users;

-- Cria nova política que permite admin e super_admin atualizarem roles
CREATE POLICY "Admins can update user roles"
ON public.users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'super_admin')
  )
);

-- Adicionar constraint para que apenas super_admin possa promover para super_admin
-- Isso é feito via trigger para maior segurança
CREATE OR REPLACE FUNCTION public.check_super_admin_promotion()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está tentando mudar role para super_admin
  IF NEW.role = 'super_admin' AND OLD.role != 'super_admin' THEN
    -- Verifica se quem está fazendo a mudança é super_admin
    IF NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'Apenas Super Admins podem promover usuários a Super Admin';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para validar promoções
DROP TRIGGER IF EXISTS validate_super_admin_promotion ON public.users;
CREATE TRIGGER validate_super_admin_promotion
  BEFORE UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_super_admin_promotion();