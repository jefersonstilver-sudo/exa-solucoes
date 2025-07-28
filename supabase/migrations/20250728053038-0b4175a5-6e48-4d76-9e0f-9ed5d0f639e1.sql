-- Primeiro, vamos remover a política TESTE conflitante e simplificar as políticas RLS
DROP POLICY IF EXISTS "TESTE" ON campaigns_advanced;

-- Criar uma política mais específica para permitir que usuários atualizem suas próprias campanhas
-- ou que admins atualizem qualquer campanha
CREATE POLICY "Users and admins can update campaigns"
ON campaigns_advanced
FOR UPDATE
USING (
  auth.uid() = client_id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  auth.uid() = client_id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Verificar se já existe política de SELECT e garantir que funciona corretamente
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campaigns_advanced;
CREATE POLICY "Users and admins can view campaigns"
ON campaigns_advanced
FOR SELECT
USING (
  auth.uid() = client_id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);