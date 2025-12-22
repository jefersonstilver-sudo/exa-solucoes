-- Remover a CHECK constraint antiga que impede novos roles
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Adicionar uma constraint que valida contra a tabela role_types (usando trigger)
-- Para maior flexibilidade, usaremos um trigger ao invés de FK simples

CREATE OR REPLACE FUNCTION public.validate_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Permitir roles que existem na tabela role_types (ativos ou não, para manter histórico)
  IF NOT EXISTS (SELECT 1 FROM public.role_types WHERE key = NEW.role) THEN
    RAISE EXCEPTION 'Invalid role: %. Role must exist in role_types table.', NEW.role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para validação dinâmica de roles
DROP TRIGGER IF EXISTS validate_user_role_trigger ON public.users;
CREATE TRIGGER validate_user_role_trigger
  BEFORE INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_role();