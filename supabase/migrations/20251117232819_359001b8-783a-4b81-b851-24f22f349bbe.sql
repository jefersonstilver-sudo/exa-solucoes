-- Corrigir is_current_user_super_admin para acessar JWT corretamente
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_jwt_data JSONB;
BEGIN
  -- Pegar o JWT completo
  v_jwt_data := auth.jwt();
  
  -- Tentar extrair role do user_metadata dentro do JWT
  -- No Supabase, user_metadata está em auth.jwt()->'user_metadata'
  v_user_role := COALESCE(
    v_jwt_data->'user_metadata'->>'role',
    (SELECT role FROM public.users WHERE id = auth.uid())
  );
  
  RAISE NOTICE '[is_current_user_super_admin] User ID: %, Role from JWT: %, Role from DB: %, Final: %', 
    auth.uid(), 
    v_jwt_data->'user_metadata'->>'role',
    (SELECT role FROM public.users WHERE id = auth.uid()),
    v_user_role;
  
  RETURN v_user_role = 'super_admin';
END;
$$;