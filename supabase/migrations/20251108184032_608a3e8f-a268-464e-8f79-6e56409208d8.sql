-- ========================================
-- FIX: Recursão infinita em user_roles RLS
-- ========================================
-- Problema: A política "Super admins can manage all roles" consulta a própria
-- tabela user_roles, causando recursão infinita.
-- 
-- Solução: Usar a tabela users diretamente em vez de user_roles.

-- 1. Drop das políticas problemáticas
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- 2. Recriar políticas SEM recursão
-- Usar users.role diretamente em vez de user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'super_admin'
  )
);

-- 3. Garantir que o usuário Jeferson tem o role correto
-- Verificar se existe entrada para admin_financeiro
INSERT INTO public.user_roles (user_id, role, granted_at, granted_by)
SELECT 
  u.id,
  'admin_financeiro'::app_role,
  NOW(),
  (SELECT id FROM users WHERE role = 'super_admin' LIMIT 1)
FROM public.users u
WHERE u.email = 'jeferson@examidia.com.br'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = u.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Atualizar users.role para garantir sincronização
UPDATE public.users
SET role = 'admin_financeiro'
WHERE email = 'jeferson@examidia.com.br'
AND (role IS NULL OR role != 'admin_financeiro');