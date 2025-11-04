-- =========================================================
-- CORREÇÃO DE SEGURANÇA: Tornar users.role read-only
-- =========================================================
-- Garante que users.role seja apenas uma cópia read-only de user_roles.role
-- Previne privilege escalation attacks

-- 1. Criar função para sincronizar user_roles -> users.role (one-way)
CREATE OR REPLACE FUNCTION public.sync_user_role_to_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar users.role quando user_roles.role mudar
  UPDATE public.users 
  SET role = NEW.role::text 
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- 2. Criar triggers para sincronização automática
DROP TRIGGER IF EXISTS sync_role_on_insert ON public.user_roles;
CREATE TRIGGER sync_role_on_insert
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_to_users();

DROP TRIGGER IF EXISTS sync_role_on_update ON public.user_roles;
CREATE TRIGGER sync_role_on_update
AFTER UPDATE ON public.user_roles
FOR EACH ROW
WHEN (OLD.role IS DISTINCT FROM NEW.role)
EXECUTE FUNCTION public.sync_user_role_to_users();

-- 3. Bloquear atualizações diretas da coluna role em users
-- (mantém INSERT e outras operações funcionando)
DROP POLICY IF EXISTS "Block direct role updates" ON public.users;
CREATE POLICY "Block direct role updates" 
ON public.users
FOR UPDATE
USING (
  -- Permite UPDATE apenas se a coluna 'role' NÃO estiver sendo modificada
  -- Ou se o usuário for um admin fazendo a mudança via user_roles
  CASE 
    WHEN current_setting('request.jwt.claims', true)::json->>'user_role' = 'super_admin' 
    THEN true
    ELSE false
  END
);

-- 4. Sincronizar dados existentes (garantir consistência)
UPDATE public.users u
SET role = ur.role::text
FROM public.user_roles ur
WHERE u.id = ur.user_id
AND u.role::app_role IS DISTINCT FROM ur.role;

-- 5. Adicionar comentários para documentação
COMMENT ON FUNCTION public.sync_user_role_to_users() IS 
'Sincroniza automaticamente user_roles.role -> users.role. Previne privilege escalation mantendo users.role como read-only copy.';

COMMENT ON TRIGGER sync_role_on_insert ON public.user_roles IS 
'Mantém users.role sincronizado quando um novo role é inserido em user_roles';

COMMENT ON TRIGGER sync_role_on_update ON public.user_roles IS 
'Mantém users.role sincronizado quando um role é atualizado em user_roles';