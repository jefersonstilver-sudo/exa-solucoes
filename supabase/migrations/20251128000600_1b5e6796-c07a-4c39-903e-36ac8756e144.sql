-- Adicionar coluna user_id na tabela exa_alerts_directors
ALTER TABLE exa_alerts_directors 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice para performance
CREATE INDEX idx_exa_directors_user_id ON exa_alerts_directors(user_id);

-- Adicionar constraint unique para evitar duplicatas (um usuário só pode ser diretor uma vez)
ALTER TABLE exa_alerts_directors 
ADD CONSTRAINT unique_director_user UNIQUE (user_id);

-- Política RLS: Apenas super_admins podem inserir/atualizar/deletar diretores
DROP POLICY IF EXISTS "Super admins can manage directors" ON exa_alerts_directors;
CREATE POLICY "Super admins can manage directors" 
ON exa_alerts_directors 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Política RLS: Super admins podem ver todos os diretores
DROP POLICY IF EXISTS "Super admins can view all directors" ON exa_alerts_directors;
CREATE POLICY "Super admins can view all directors" 
ON exa_alerts_directors 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);