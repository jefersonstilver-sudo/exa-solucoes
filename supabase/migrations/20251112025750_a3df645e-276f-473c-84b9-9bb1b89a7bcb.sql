-- Corrigir políticas RLS da tabela configuracoes_sistema
-- Permitir que super_admin crie configurações

-- Remover políticas existentes
DROP POLICY IF EXISTS "Apenas super_admin pode inserir configurações" ON configuracoes_sistema;
DROP POLICY IF EXISTS "Apenas super_admin pode atualizar configurações" ON configuracoes_sistema;
DROP POLICY IF EXISTS "Apenas super_admin pode deletar configurações" ON configuracoes_sistema;
DROP POLICY IF EXISTS "Todos podem ler configurações do sistema" ON configuracoes_sistema;
DROP POLICY IF EXISTS "Super admin pode inserir configurações" ON configuracoes_sistema;
DROP POLICY IF EXISTS "Super admin pode atualizar configurações" ON configuracoes_sistema;
DROP POLICY IF EXISTS "Todos podem ler configurações" ON configuracoes_sistema;
DROP POLICY IF EXISTS "Super admin pode deletar configurações" ON configuracoes_sistema;

-- Criar novas políticas usando a tabela users
CREATE POLICY "Super admin pode inserir configurações"
  ON configuracoes_sistema
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin pode atualizar configurações"
  ON configuracoes_sistema
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Todos podem ler configurações"
  ON configuracoes_sistema
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin pode deletar configurações"
  ON configuracoes_sistema
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );