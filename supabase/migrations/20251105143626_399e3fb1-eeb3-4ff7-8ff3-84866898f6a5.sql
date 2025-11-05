-- Remover constraint antigo e criar novo que aceita admin_financeiro
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Criar novo constraint incluindo admin_financeiro
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('client', 'admin', 'admin_marketing', 'admin_financeiro', 'super_admin', 'painel'));