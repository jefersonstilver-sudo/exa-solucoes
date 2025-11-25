-- Criar políticas RLS para contact_types
-- Admins podem visualizar todos os tipos
CREATE POLICY "Admins can view all contact types"
  ON contact_types FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Admins podem inserir novos tipos (apenas não-default)
CREATE POLICY "Admins can insert custom contact types"
  ON contact_types FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
    AND is_default = false
  );

-- Admins podem atualizar tipos não-default
CREATE POLICY "Admins can update custom contact types"
  ON contact_types FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
    AND is_default = false
  )
  WITH CHECK (
    is_default = false
  );

-- Admins podem deletar tipos não-default
CREATE POLICY "Admins can delete custom contact types"
  ON contact_types FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
    AND is_default = false
  );