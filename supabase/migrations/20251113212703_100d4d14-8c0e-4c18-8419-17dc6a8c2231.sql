-- ============================================
-- MIGRAÇÃO: Corrigir RLS para permitir operações com SERVICE_ROLE_KEY
-- ============================================

-- Remove políticas restritivas existentes na tabela pedidos
DROP POLICY IF EXISTS "Users can only view their own orders" ON pedidos;
DROP POLICY IF EXISTS "Users can only insert their own orders" ON pedidos;
DROP POLICY IF EXISTS "Users can only update their own orders" ON pedidos;

-- Cria políticas que permitem operações via SERVICE_ROLE_KEY
CREATE POLICY "Enable read access for authenticated users" 
ON pedidos FOR SELECT 
USING (
  auth.uid() = client_id OR 
  auth.jwt()->>'role' = 'service_role'
);

CREATE POLICY "Enable insert for authenticated users and service role" 
ON pedidos FOR INSERT 
WITH CHECK (
  auth.uid() = client_id OR 
  auth.jwt()->>'role' = 'service_role'
);

CREATE POLICY "Enable update for authenticated users and service role" 
ON pedidos FOR UPDATE 
USING (
  auth.uid() = client_id OR 
  auth.jwt()->>'role' = 'service_role'
);

CREATE POLICY "Enable delete for authenticated users and service role" 
ON pedidos FOR DELETE 
USING (
  auth.uid() = client_id OR 
  auth.jwt()->>'role' = 'service_role'
);

-- Log da migração
INSERT INTO log_eventos_sistema (tipo_evento, descricao)
VALUES ('RLS_MIGRATION', 'Políticas RLS atualizadas para permitir operações com SERVICE_ROLE_KEY na tabela pedidos');