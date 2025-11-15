-- =====================================================
-- FASE 3: RECUPERAR ESPAÇO E ATUALIZAR ESTATÍSTICAS
-- =====================================================

-- VACUUM não pode rodar dentro de transaction, então vamos apenas atualizar estatísticas
ANALYZE video_management_logs;
ANALYZE log_eventos_sistema;
ANALYZE user_behavior_tracking;
ANALYZE user_sessions;
ANALYZE active_sessions_monitor;
ANALYZE email_logs;
ANALYZE auth_detailed_logs;
ANALYZE webhook_logs;
ANALYZE pedidos;