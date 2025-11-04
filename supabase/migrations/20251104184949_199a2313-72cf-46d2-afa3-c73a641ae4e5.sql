-- Corrigir recursão infinita nas políticas de provider_benefits
-- Usar função has_role ao invés de query direta

-- Dropar políticas existentes
DROP POLICY IF EXISTS "Admins can view all benefits" ON provider_benefits;
DROP POLICY IF EXISTS "Admins can insert benefits" ON provider_benefits;
DROP POLICY IF EXISTS "Admins can update benefits" ON provider_benefits;

-- Criar políticas usando has_role function (que já existe e é SECURITY DEFINER)
CREATE POLICY "Admins can view all benefits" 
ON provider_benefits 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can insert benefits" 
ON provider_benefits 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can update benefits" 
ON provider_benefits 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);