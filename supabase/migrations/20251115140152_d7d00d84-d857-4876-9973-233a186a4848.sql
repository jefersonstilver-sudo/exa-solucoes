-- =====================================================
-- FASE 1: CRIAR ÍNDICES CRÍTICOS (APENAS TABELAS CONHECIDAS)
-- =====================================================

-- 1. Índices para log_eventos_sistema
CREATE INDEX IF NOT EXISTS idx_log_eventos_created_at ON log_eventos_sistema(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_eventos_tipo ON log_eventos_sistema(tipo_evento);

-- 2. Índices para user_behavior_tracking
CREATE INDEX IF NOT EXISTS idx_behavior_created_at ON user_behavior_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_user_session ON user_behavior_tracking(user_id, session_id);

-- 3. Índices para user_sessions
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON user_sessions(user_id, created_at DESC);

-- 4. Índices para active_sessions_monitor
CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions_monitor(user_id, last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_active_sessions_active ON active_sessions_monitor(is_active) WHERE is_active = true;

-- 5. Índice composto para pedidos (usado em realtime)
CREATE INDEX IF NOT EXISTS idx_pedidos_status_created ON pedidos(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_client_created ON pedidos(client_id, created_at DESC);

-- 6. Índices para email_logs (tabela documentada)
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- 7. Índices para auth_detailed_logs
CREATE INDEX IF NOT EXISTS idx_auth_logs_created ON auth_detailed_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user ON auth_detailed_logs(user_id) WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_sessions_expires_at IS 'Acelera cleanup de sessões expiradas';
COMMENT ON INDEX idx_pedidos_status_created IS 'Acelera queries de pedidos por status';