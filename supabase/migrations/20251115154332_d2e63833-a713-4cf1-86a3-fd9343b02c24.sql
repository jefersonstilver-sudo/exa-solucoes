-- =====================================================
-- CORREÇÃO: Remover INSERT que viola RLS
-- =====================================================

-- Recriar função SEM tentar inserir em log_eventos_sistema (viola RLS)
CREATE OR REPLACE FUNCTION invalidate_user_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas deletar sessões, SEM tentar fazer log
  DELETE FROM active_sessions_monitor WHERE user_id = OLD.id;
  
  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION invalidate_user_sessions IS 'Invalida sessões quando usuário deletado - SEM logs que violem RLS';