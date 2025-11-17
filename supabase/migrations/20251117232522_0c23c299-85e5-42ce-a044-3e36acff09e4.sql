-- Corrigir função is_current_user_super_admin para usar JWT claims
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Primeiro tentar pegar do JWT (user_metadata.role)
  v_user_role := COALESCE(
    auth.jwt()->>'user_metadata'->>'role',
    (SELECT role FROM public.users WHERE id = auth.uid())
  );
  
  RAISE NOTICE '[is_current_user_super_admin] User ID: %, Role: %', auth.uid(), v_user_role;
  
  RETURN v_user_role = 'super_admin';
END;
$$;