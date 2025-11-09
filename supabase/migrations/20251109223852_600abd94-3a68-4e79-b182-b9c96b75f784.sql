-- ============================================
-- SISTEMA DE AUDITORIA COMPLETA
-- ============================================

-- Tabela para salvar análises de IA do CRM
CREATE TABLE IF NOT EXISTS crm_ai_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analyzed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  analysis_data JSONB NOT NULL,
  interest_score INTEGER NOT NULL,
  interest_level TEXT NOT NULL,
  conversion_probability TEXT NOT NULL,
  churn_risk TEXT NOT NULL,
  recommended_actions JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_crm_ai_analysis_user ON crm_ai_analysis_history(user_id);
CREATE INDEX idx_crm_ai_analysis_date ON crm_ai_analysis_history(created_at DESC);

-- Tabela para log de ações no CRM
CREATE TABLE IF NOT EXISTS crm_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  performed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'view_profile', 'add_note', 'analyze_ai', 'send_email', 'call_client'
  action_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_crm_action_logs_client ON crm_action_logs(client_id);
CREATE INDEX idx_crm_action_logs_user ON crm_action_logs(performed_by);
CREATE INDEX idx_crm_action_logs_date ON crm_action_logs(created_at DESC);

-- Tabela para auditoria de acessos financeiros
CREATE TABLE IF NOT EXISTS financial_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'order', 'report', 'transaction', 'benefit'
  resource_id UUID,
  action TEXT NOT NULL, -- 'view', 'export', 'modify'
  data_accessed JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT
);

CREATE INDEX idx_financial_access_user ON financial_access_logs(user_id);
CREATE INDEX idx_financial_access_date ON financial_access_logs(created_at DESC);
CREATE INDEX idx_financial_access_type ON financial_access_logs(resource_type);

-- Tabela para logs de autenticação detalhados
CREATE TABLE IF NOT EXISTS auth_detailed_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'login_success', 'login_failed', 'logout', 'password_reset', 'email_verified'
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT, -- 'mobile', 'desktop', 'tablet'
  browser TEXT,
  os TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_auth_detailed_user ON auth_detailed_logs(user_id);
CREATE INDEX idx_auth_detailed_email ON auth_detailed_logs(email);
CREATE INDEX idx_auth_detailed_ip ON auth_detailed_logs(ip_address);
CREATE INDEX idx_auth_detailed_date ON auth_detailed_logs(created_at DESC);

-- Tabela para monitoramento de sessões ativas
CREATE TABLE IF NOT EXISTS active_sessions_monitor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_activity TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_active_sessions_user ON active_sessions_monitor(user_id);
CREATE INDEX idx_active_sessions_active ON active_sessions_monitor(is_active);
CREATE INDEX idx_active_sessions_ip ON active_sessions_monitor(ip_address);

-- RLS Policies
ALTER TABLE crm_ai_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_detailed_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions_monitor ENABLE ROW LEVEL SECURITY;

-- Políticas para CRM AI Analysis History
CREATE POLICY "Admins can view all AI analyses"
  ON crm_ai_analysis_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() 
    AND users.role IN ('super_admin', 'admin', 'admin_marketing')
  ));

CREATE POLICY "System can insert AI analyses"
  ON crm_ai_analysis_history FOR INSERT
  WITH CHECK (true);

-- Políticas para CRM Action Logs
CREATE POLICY "Admins can view CRM actions"
  ON crm_action_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() 
    AND users.role IN ('super_admin', 'admin', 'admin_marketing')
  ));

CREATE POLICY "System can insert CRM actions"
  ON crm_action_logs FOR INSERT
  WITH CHECK (true);

-- Políticas para Financial Access Logs
CREATE POLICY "Super admins can view financial access"
  ON financial_access_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  ));

CREATE POLICY "System can insert financial access"
  ON financial_access_logs FOR INSERT
  WITH CHECK (true);

-- Políticas para Auth Detailed Logs
CREATE POLICY "Super admins can view auth logs"
  ON auth_detailed_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  ));

CREATE POLICY "System can insert auth logs"
  ON auth_detailed_logs FOR INSERT
  WITH CHECK (true);

-- Políticas para Active Sessions Monitor
CREATE POLICY "Admins can view all sessions"
  ON active_sessions_monitor FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() 
    AND users.role IN ('super_admin', 'admin')
  ));

CREATE POLICY "Users can view their own sessions"
  ON active_sessions_monitor FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage sessions"
  ON active_sessions_monitor FOR ALL
  USING (true)
  WITH CHECK (true);
