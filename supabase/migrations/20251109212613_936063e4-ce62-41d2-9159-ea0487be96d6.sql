
-- Fix: Corrigir trigger que está causando erro de database
-- O problema é que ON CONFLICT está tentando UPDATE mas deveria fazer NOTHING

CREATE OR REPLACE FUNCTION public.sync_users_role_to_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role IS NOT NULL THEN
    -- Se o par (user_id, role) já existe, não fazer nada
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, NEW.role::app_role)
    ON CONFLICT (user_id, role) 
    DO NOTHING; -- Mudança crítica: DO NOTHING em vez de DO UPDATE
  END IF;
  RETURN NEW;
END;
$function$;
