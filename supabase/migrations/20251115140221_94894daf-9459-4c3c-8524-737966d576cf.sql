-- =====================================================
-- FASE 2: LIMPAR LOGS ANTIGOS (CONSERVADOR)
-- =====================================================

-- 1. Limpar video_management_logs > 7 dias (maior tabela: 58 MB)
DELETE FROM video_management_logs 
WHERE created_at < NOW() - INTERVAL '7 days';

-- 2. Limpar log_eventos_sistema > 30 dias (manter logs do sistema por mais tempo)
DELETE FROM log_eventos_sistema 
WHERE created_at < NOW() - INTERVAL '30 days';

-- 3. Limpar user_behavior_tracking > 30 dias
DELETE FROM user_behavior_tracking 
WHERE created_at < NOW() - INTERVAL '30 days';

-- 4. Limpar sessões expiradas
DELETE FROM user_sessions 
WHERE expires_at < NOW();

-- 5. Limpar sessões inativas > 7 dias
DELETE FROM active_sessions_monitor 
WHERE is_active = false 
AND ended_at < NOW() - INTERVAL '7 days';

-- 6. Limpar email_logs > 30 dias (manter para compliance)
DELETE FROM email_logs 
WHERE created_at < NOW() - INTERVAL '30 days';

-- 7. Limpar auth_detailed_logs > 30 dias
DELETE FROM auth_detailed_logs 
WHERE created_at < NOW() - INTERVAL '30 days';

-- 8. Limpar webhook_logs > 7 dias
DELETE FROM webhook_logs 
WHERE created_at < NOW() - INTERVAL '7 days';