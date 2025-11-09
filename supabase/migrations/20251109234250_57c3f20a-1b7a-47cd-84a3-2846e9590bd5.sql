
-- CORREÇÃO CRÍTICA: Políticas RLS da tabela videos bloqueando acesso de admins
-- Problema: Múltiplas políticas conflitantes impedindo visualização de vídeos

-- 1. Remover políticas antigas conflitantes
DROP POLICY IF EXISTS "Admins can manage all videos" ON videos;
DROP POLICY IF EXISTS "Admins can read all videos" ON videos;
DROP POLICY IF EXISTS "Clients can create their own videos" ON videos;
DROP POLICY IF EXISTS "Clients can delete their own videos" ON videos;
DROP POLICY IF EXISTS "Clients can read their own videos" ON videos;
DROP POLICY IF EXISTS "Clients can update their own videos" ON videos;
DROP POLICY IF EXISTS "admin_manage_videos" ON videos;
DROP POLICY IF EXISTS "client_manage_own_videos" ON videos;
DROP POLICY IF EXISTS "super_admin_full_access_videos" ON videos;

-- 2. Criar políticas simplificadas e corretas

-- Super Admins têm acesso total
CREATE POLICY "super_admins_full_access_videos"
ON videos FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
);

-- Admins têm acesso total de leitura e gerenciamento
CREATE POLICY "admins_full_access_videos"
ON videos FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Clientes podem gerenciar apenas seus próprios vídeos
CREATE POLICY "clients_manage_own_videos"
ON videos FOR ALL
TO public
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- Comentários explicativos
COMMENT ON POLICY "super_admins_full_access_videos" ON videos IS 
  'Super admins podem fazer qualquer operação em qualquer vídeo';
  
COMMENT ON POLICY "admins_full_access_videos" ON videos IS 
  'Admins podem fazer qualquer operação em qualquer vídeo';
  
COMMENT ON POLICY "clients_manage_own_videos" ON videos IS 
  'Clientes podem gerenciar apenas seus próprios vídeos';
