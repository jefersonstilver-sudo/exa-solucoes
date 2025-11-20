-- Adicionar políticas RLS permissivas temporárias para debug
-- (IMPORTANTE: Revisar e ajustar para produção)

-- Política para conversations: permitir leitura para todos autenticados
DROP POLICY IF EXISTS "allow_read_conversations" ON conversations;
CREATE POLICY "allow_read_conversations" ON conversations
  FOR SELECT TO authenticated
  USING (true);

-- Política para messages: permitir leitura para todos autenticados
DROP POLICY IF EXISTS "allow_read_messages" ON messages;
CREATE POLICY "allow_read_messages" ON messages
  FOR SELECT TO authenticated
  USING (true);

-- Política para inserção de conversas via service_role (webhooks)
DROP POLICY IF EXISTS "service_role_insert_conversations" ON conversations;
CREATE POLICY "service_role_insert_conversations" ON conversations
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Política para update de conversas via service_role (webhooks)
DROP POLICY IF EXISTS "service_role_update_conversations" ON conversations;
CREATE POLICY "service_role_update_conversations" ON conversations
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

-- Política para inserção de mensagens via service_role (webhooks)
DROP POLICY IF EXISTS "service_role_insert_messages" ON messages;
CREATE POLICY "service_role_insert_messages" ON messages
  FOR INSERT TO service_role
  WITH CHECK (true);