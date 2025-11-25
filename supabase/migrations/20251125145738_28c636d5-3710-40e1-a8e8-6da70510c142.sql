-- Permitir que usuários autenticados façam UPDATE na tabela conversations
-- Necessário para permitir que admins atualizem contact_type, tags, notas, etc. pelo frontend

CREATE POLICY "authenticated_update_conversations" ON conversations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);