-- ============================================
-- FASE 1: MIGRAÇÃO DE ROLES PARA user_roles
-- ============================================

-- 1.1. Popular user_roles com dados existentes da tabela users
INSERT INTO user_roles (user_id, role, granted_at, granted_by)
SELECT 
  id as user_id,
  role::app_role as role,
  data_criacao as granted_at,
  NULL as granted_by
FROM users
WHERE role IS NOT NULL
AND role != ''
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = users.id
);

-- 1.2. Recriar função helper para obter role do usuário
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- ============================================
-- FASE 2: CUSTOM ACCESS TOKEN HOOK (JWT)
-- ============================================

-- 2.1. Criar hook para adicionar role ao JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_role app_role;
BEGIN
  -- Buscar role do usuário na tabela user_roles
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = (event->>'user_id')::uuid
  LIMIT 1;

  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    -- Adicionar role ao JWT
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role::text));
  ELSE
    -- Fallback: client
    claims := jsonb_set(claims, '{user_role}', '"client"');
  END IF;

  -- Retornar event com claims atualizados
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- ============================================
-- FASE 3: ATUALIZAR RLS POLICIES
-- ============================================

-- 3.1. Atualizar policy de criação de pedidos (BLOQUEAR ADMINS)
DROP POLICY IF EXISTS "users_create_own_pedidos" ON pedidos;

CREATE POLICY "users_create_own_pedidos" 
ON pedidos
FOR INSERT
WITH CHECK (
  auth.uid() = client_id 
  AND has_role(auth.uid(), 'client'::app_role)
);

-- 3.2. Adicionar policy para bloquear admins de modificar próprios pedidos
DROP POLICY IF EXISTS "admins_cannot_modify_own_pedidos" ON pedidos;

CREATE POLICY "admins_cannot_modify_own_pedidos"
ON pedidos
FOR ALL
USING (
  NOT (
    auth.uid() = client_id 
    AND (
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'admin_financeiro'::app_role) OR
      has_role(auth.uid(), 'admin_marketing'::app_role) OR
      has_role(auth.uid(), 'super_admin'::app_role)
    )
  )
);

-- ============================================
-- FASE 4: CORRIGIR USUÁRIO JEFERSON
-- ============================================

-- 4.1. Inserir entrada em user_roles para Jeferson
INSERT INTO user_roles (user_id, role, granted_at, granted_by)
VALUES (
  '3a576b42-10d8-4303-a69e-bd24d3fb7dcf',
  'admin_financeiro',
  NOW(),
  NULL
)
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- FASE 5: MARCAR PEDIDOS INVÁLIDOS DE ADMINS
-- ============================================

-- 5.1. Marcar pedidos feitos por contas administrativas
UPDATE pedidos
SET 
  is_test_order = true,
  blocked_reason = 'Pedido criado por conta administrativa - bloqueado automaticamente pelo sistema',
  blocked_at = NOW()
WHERE client_id IN (
  SELECT user_id 
  FROM user_roles 
  WHERE role IN ('admin', 'admin_financeiro', 'admin_marketing', 'super_admin')
)
AND is_test_order = false;

-- ============================================
-- FASE 6: VERIFICAÇÃO E AUDITORIA
-- ============================================

-- 6.1. Verificar integridade após migração
DO $$
DECLARE
  users_without_role INTEGER;
  admins_with_orders INTEGER;
  roles_migrated INTEGER;
BEGIN
  -- Contar usuários sem role
  SELECT COUNT(*) INTO users_without_role
  FROM users u
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  WHERE ur.user_id IS NULL;
  
  -- Contar admins com pedidos não bloqueados
  SELECT COUNT(DISTINCT p.client_id) INTO admins_with_orders
  FROM pedidos p
  INNER JOIN user_roles ur ON p.client_id = ur.user_id
  WHERE ur.role != 'client'
  AND p.is_test_order = false;
  
  -- Contar roles migrados
  SELECT COUNT(*) INTO roles_migrated FROM user_roles;
  
  RAISE NOTICE '✅ Migração concluída:';
  RAISE NOTICE '   - % roles migrados', roles_migrated;
  RAISE NOTICE '   - % usuários sem role', users_without_role;
  RAISE NOTICE '   - % admins com pedidos ativos', admins_with_orders;
END $$;