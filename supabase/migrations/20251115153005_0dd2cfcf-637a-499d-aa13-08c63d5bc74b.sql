-- =====================================================
-- CORREÇÃO: Trigger não deve inserir em tabelas com FK
-- =====================================================

-- Recriar função SEM inserir em role_change_audit (que tem FK para users)
CREATE OR REPLACE FUNCTION invalidate_user_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deletar todas as sessões ativas do usuário
  DELETE FROM user_sessions WHERE user_id = OLD.id;
  DELETE FROM active_sessions_monitor WHERE user_id = OLD.id;
  
  -- Log apenas em log_eventos_sistema (não tem FK problemático)
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

COMMENT ON FUNCTION invalidate_user_sessions IS 'Invalida sessões quando usuário deletado - SEM inserir em tabelas com FK';