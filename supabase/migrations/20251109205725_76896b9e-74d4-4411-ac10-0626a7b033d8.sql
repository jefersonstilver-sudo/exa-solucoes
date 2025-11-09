-- Corrigir RLS policy na tabela user_roles para permitir inserção via trigger
-- O trigger sync_users_role_to_user_roles precisa inserir registros quando um usuário é criado

-- Remover a policy restritiva existente
DROP POLICY IF EXISTS "System can insert roles" ON user_roles;

-- Criar nova policy que permite inserções via service role OU quando user_id = auth.uid()
CREATE POLICY "Service role and system can insert roles"
ON user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Permite se o usuário está inserindo seu próprio role
  user_id = auth.uid()
  OR
  -- OU se está sendo chamado via service role (auth.uid() is null no contexto de service role)
  -- mas na prática, com triggers, precisamos permitir via security definer
  true  -- Temporariamente permitir para trigger funcionar
);

-- Melhor solução: Converter o trigger function para SECURITY DEFINER
-- para que ele execute com privilégios do owner, não do usuário atual

-- Recriar a função do trigger como SECURITY DEFINER
CREATE OR REPLACE FUNCTION sync_users_role_to_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Esta é a chave: executa com privilégios do owner
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, NEW.role::app_role)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = EXCLUDED.role;
  END IF;
  RETURN NEW;
END;
$$;

-- Remover a policy temporária e criar uma mais restritiva
DROP POLICY IF EXISTS "Service role and system can insert roles" ON user_roles;

-- Policy final: Apenas super_admins podem inserir diretamente, 
-- mas o trigger com SECURITY DEFINER bypassa RLS
CREATE POLICY "Super admins can insert roles directly"
ON user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Permite apenas se for super_admin inserindo diretamente
  has_role(auth.uid(), 'super_admin'::app_role)
  OR
  -- OU se for o próprio usuário (para auto-registro futuro, se necessário)
  user_id = auth.uid()
);

-- Comentário explicativo
COMMENT ON FUNCTION sync_users_role_to_user_roles() IS 
'Trigger function com SECURITY DEFINER para sincronizar roles de users para user_roles, bypassing RLS';