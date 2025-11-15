-- =====================================================
-- SEGURANÇA: Invalidar sessões quando usuário é deletado
-- =====================================================

-- Função para invalidar todas as sessões de um usuário deletado
CREATE OR REPLACE FUNCTION invalidate_user_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deletar todas as sessões ativas do usuário
  DELETE FROM user_sessions WHERE user_id = OLD.id;
  DELETE FROM active_sessions_monitor WHERE user_id = OLD.id;
  
  -- Log do evento
  INSERT INTO log_eventos_sistema (
    tipo_evento,
    descricao,
    nivel_gravidade,
    metadata
  ) VALUES (
    'user_deleted_sessions_invalidated',
    'Sessões invalidadas após deleção de usuário',
    'info',
    jsonb_build_object(
      'user_id', OLD.id,
      'email', OLD.email,
      'deleted_at', NOW()
    )
  );
  
  RETURN OLD;
END;
$$;

-- Trigger para executar antes de deletar usuário
DROP TRIGGER IF EXISTS trigger_invalidate_sessions_on_user_delete ON auth.users;
CREATE TRIGGER trigger_invalidate_sessions_on_user_delete
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_user_sessions();

COMMENT ON FUNCTION invalidate_user_sessions IS 'Invalida todas as sessões quando um usuário é deletado para segurança';