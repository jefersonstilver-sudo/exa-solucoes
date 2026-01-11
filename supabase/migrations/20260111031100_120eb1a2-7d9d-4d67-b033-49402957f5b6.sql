-- Correção 1: Adicionar RLS DELETE para parcelas_despesas
CREATE POLICY "Admins podem deletar parcelas" ON parcelas_despesas
  FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'super_admin', 'admin_master', 'admin_financeiro')
  ));