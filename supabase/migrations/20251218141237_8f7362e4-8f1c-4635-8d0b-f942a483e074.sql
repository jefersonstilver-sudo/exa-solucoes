-- ============================================================
-- FIX: Bug crítico de roles duplicados - admin_financeiro logando como client
-- ============================================================

-- 1. CRIAR FUNÇÃO get_user_highest_role para retornar role de maior prioridade
CREATE OR REPLACE FUNCTION public.get_user_highest_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  highest_role text;
BEGIN
  -- Ordem de prioridade: super_admin > admin > admin_marketing > admin_financeiro > painel > client
  SELECT role INTO highest_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  ORDER BY 
    CASE role::text
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'admin_marketing' THEN 3
      WHEN 'admin_financeiro' THEN 4
      WHEN 'painel' THEN 5
      WHEN 'client' THEN 6
      ELSE 99
    END
  LIMIT 1;
  
  RETURN COALESCE(highest_role, 'client');
END;
$$;

-- 2. LIMPAR DUPLICATAS: Remover role 'client' quando existe role admin
DELETE FROM public.user_roles ur1
WHERE ur1.role = 'client'::public.app_role
AND EXISTS (
  SELECT 1 FROM public.user_roles ur2 
  WHERE ur2.user_id = ur1.user_id 
  AND ur2.role::text IN ('super_admin', 'admin', 'admin_marketing', 'admin_financeiro')
);

-- 3. SINCRONIZAR tabela users com role correto de user_roles
UPDATE public.users u
SET role = (
  SELECT public.get_user_highest_role(u.id)
)
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
);

-- 4. GRANT permissões para função RPC
GRANT EXECUTE ON FUNCTION public.get_user_highest_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_highest_role(uuid) TO anon;