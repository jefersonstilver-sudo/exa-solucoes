-- Corrigir função is_current_user_super_admin para usar JWT claims corretamente
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_jwt_role TEXT;
  v_db_role TEXT;
BEGIN
  -- Tentar pegar do JWT user_metadata
  BEGIN
    v_jwt_role := (auth.jwt()->'user_metadata'->>'role');
  EXCEPTION WHEN OTHERS THEN
    v_jwt_role := NULL;
  END;
  
  -- Pegar da tabela users como fallback
  SELECT role INTO v_db_role FROM public.users WHERE id = auth.uid();
  
  -- Usar JWT se disponível, senão usar DB
  v_user_role := COALESCE(v_jwt_role, v_db_role);
  
  RAISE NOTICE '[is_current_user_super_admin] User ID: %, JWT Role: %, DB Role: %, Final Role: %', 
    auth.uid(), v_jwt_role, v_db_role, v_user_role;
  
  RETURN v_user_role = 'super_admin';
END;
$$;