-- =====================================================
-- CORREÇÃO FINAL: Usar colunas corretas e tabelas existentes
-- =====================================================

-- Recriar função com as colunas corretas
CREATE OR REPLACE FUNCTION invalidate_user_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deletar apenas de active_sessions_monitor (user_sessions não existe)
  DELETE FROM active_sessions_monitor WHERE user_id = OLD.id;
  
  -- Log com as colunas corretas de log_eventos_sistema
  INSERT INTO log_eventos_sistema (
    tipo_evento,
    descricao,
    metadata
  ) VALUES (
    'user_deleted_sessions_invalidated',
    'Sessões invalidadas após deleção de usuário: ' || OLD.email,
    jsonb_build_object(
      'user_id', OLD.id,
      'email', OLD.email,
      'deleted_at', NOW()
    )
  );
  
  RETURN OLD;
END;
$$;

COMMENT ON FUNCTION invalidate_user_sessions IS 'Invalida sessões de active_sessions_monitor quando usuário deletado';