-- =====================================================
-- CORREÇÃO: Prevenir erro ao deletar usuário
-- =====================================================

-- Modificar log_role_changes para não inserir quando usuário está sendo deletado
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só fazer log se NÃO estamos deletando
  -- (evita erro de FK quando usuário está sendo deletado)
  IF TG_OP = 'INSERT' THEN
    -- Verificar se usuário ainda existe antes de inserir
    IF EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id) THEN
      INSERT INTO public.role_change_audit (user_id, new_role, changed_by)
      VALUES (NEW.user_id, NEW.role, NEW.granted_by);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- NÃO fazer log em DELETE para evitar erro de FK
    -- quando usuário está sendo deletado em cascata
    NULL;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

COMMENT ON FUNCTION log_role_changes IS 'Log de mudanças de role - SEM inserir em DELETE para evitar erro de FK';