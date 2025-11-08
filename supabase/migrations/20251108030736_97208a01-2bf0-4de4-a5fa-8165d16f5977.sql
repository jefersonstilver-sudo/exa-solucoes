-- Corrigir role do usuário financeiro criado incorretamente
UPDATE users 
SET 
  role = 'admin_financeiro',
  nome = 'Administrador Financeiro'
WHERE email = 'financeiro@examidia.com.br' 
  AND role = 'admin';

-- Comentário explicativo
COMMENT ON COLUMN users.role IS 'Role do usuário: super_admin, admin, admin_marketing, admin_financeiro, client, painel';