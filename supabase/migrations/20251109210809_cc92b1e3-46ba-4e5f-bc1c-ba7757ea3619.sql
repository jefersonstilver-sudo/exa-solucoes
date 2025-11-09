-- Corrigir o trigger para usar a constraint correta
-- O problema: ON CONFLICT (user_id) não existe, é ON CONFLICT (user_id, role)

CREATE OR REPLACE FUNCTION sync_users_role_to_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS NOT NULL THEN
    -- Usar a constraint correta: (user_id, role)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, NEW.role::app_role)
    ON CONFLICT (user_id, role) 
    DO UPDATE SET role = EXCLUDED.role;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION sync_users_role_to_user_roles() IS 
'Trigger function com SECURITY DEFINER para sincronizar roles de users para user_roles. Usa constraint (user_id, role)';