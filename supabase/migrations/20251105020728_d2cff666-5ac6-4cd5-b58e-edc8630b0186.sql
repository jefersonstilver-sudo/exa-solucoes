-- ============================================================
-- FASE 1: INFRAESTRUTURA DE TRACKING DE CICLO DE VIDA
-- ============================================================

-- 1.1 Tabela de Atividade na Plataforma (agregada)
CREATE TABLE IF NOT EXISTS client_platform_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  
  -- Métricas de Login/Acesso
  total_logins INTEGER DEFAULT 0,
  last_login TIMESTAMP WITH TIME ZONE,
  login_frequency NUMERIC, -- logins por semana média
  
  -- Métricas de Vídeos
  total_videos_uploaded INTEGER DEFAULT 0,
  total_videos_swapped INTEGER DEFAULT 0,
  videos_pending_approval INTEGER DEFAULT 0,
  videos_approved INTEGER DEFAULT 0,
  videos_rejected INTEGER DEFAULT 0,
  last_video_upload TIMESTAMP WITH TIME ZONE,
  
  -- Métricas de Pedidos Ativos
  active_orders_count INTEGER DEFAULT 0,
  active_orders_views INTEGER DEFAULT 0,
  last_order_view TIMESTAMP WITH TIME ZONE,
  
  -- Métricas de Renovação
  nearest_renewal_date DATE,
  days_until_renewal INTEGER,
  renewal_notifications_sent INTEGER DEFAULT 0,
  
  -- Engagement Score
  platform_engagement_score INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_platform_activity_user ON client_platform_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_activity_engagement ON client_platform_activity(platform_engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_platform_activity_renewal ON client_platform_activity(nearest_renewal_date);

-- 1.2 Tabela de Eventos de Atividade (log detalhado)
CREATE TABLE IF NOT EXISTS client_activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_user ON client_activity_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_type ON client_activity_events(event_type, created_at DESC);

-- 1.3 Adicionar campos novos em client_behavior_analytics
ALTER TABLE client_behavior_analytics
  ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT DEFAULT 'prospect',
  ADD COLUMN IF NOT EXISTS has_active_plan BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS plan_end_date DATE,
  ADD COLUMN IF NOT EXISTS days_until_renewal INTEGER,
  ADD COLUMN IF NOT EXISTS platform_usage_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_platform_activity TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS total_platform_logins INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_videos_managed INTEGER DEFAULT 0;

-- 1.4 Função para registrar evento de atividade
CREATE OR REPLACE FUNCTION log_client_activity(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  -- Inserir evento
  INSERT INTO client_activity_events (user_id, event_type, event_data)
  VALUES (p_user_id, p_event_type, p_event_data);
  
  -- Criar registro de platform_activity se não existir
  INSERT INTO client_platform_activity (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Atualizar métricas agregadas baseado no tipo de evento
  IF p_event_type = 'login' THEN
    UPDATE client_platform_activity
    SET total_logins = total_logins + 1,
        last_login = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    UPDATE client_behavior_analytics
    SET total_platform_logins = total_platform_logins + 1,
        last_platform_activity = NOW()
    WHERE user_id = p_user_id;
    
  ELSIF p_event_type = 'video_upload' THEN
    UPDATE client_platform_activity
    SET total_videos_uploaded = total_videos_uploaded + 1,
        last_video_upload = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    UPDATE client_behavior_analytics
    SET total_videos_managed = total_videos_managed + 1,
        last_platform_activity = NOW()
    WHERE user_id = p_user_id;
    
  ELSIF p_event_type = 'video_swap' THEN
    UPDATE client_platform_activity
    SET total_videos_swapped = total_videos_swapped + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    UPDATE client_behavior_analytics
    SET total_videos_managed = total_videos_managed + 1,
        last_platform_activity = NOW()
    WHERE user_id = p_user_id;
    
  ELSIF p_event_type = 'order_view' THEN
    UPDATE client_platform_activity
    SET active_orders_views = active_orders_views + 1,
        last_order_view = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    UPDATE client_behavior_analytics
    SET last_platform_activity = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.5 Função para calcular lifecycle stage
CREATE OR REPLACE FUNCTION calculate_lifecycle_stage(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_has_active_order BOOLEAN;
  v_days_until_renewal INTEGER;
  v_last_login TIMESTAMP;
  v_total_logins INTEGER;
  v_days_since_login INTEGER;
BEGIN
  -- Buscar dados de atividade
  SELECT last_login, total_logins
  INTO v_last_login, v_total_logins
  FROM client_platform_activity
  WHERE user_id = p_user_id;
  
  -- Verificar se tem pedido ativo
  SELECT EXISTS (
    SELECT 1 FROM pedidos
    WHERE client_id = p_user_id
    AND status IN ('ativo', 'pago', 'pago_pendente_video', 'video_aprovado', 'video_enviado')
    AND (data_fim IS NULL OR data_fim >= CURRENT_DATE)
  ) INTO v_has_active_order;
  
  -- Calcular dias até renovação mais próxima
  SELECT MIN(EXTRACT(DAY FROM (data_fim - CURRENT_DATE)))::INTEGER
  INTO v_days_until_renewal
  FROM pedidos
  WHERE client_id = p_user_id
  AND status IN ('ativo', 'pago', 'pago_pendente_video', 'video_aprovado', 'video_enviado')
  AND data_fim IS NOT NULL
  AND data_fim >= CURRENT_DATE;
  
  -- Calcular dias desde último login
  IF v_last_login IS NOT NULL THEN
    v_days_since_login := EXTRACT(DAY FROM (NOW() - v_last_login))::INTEGER;
  ELSE
    v_days_since_login := 999;
  END IF;
  
  -- Determinar stage
  IF NOT v_has_active_order THEN
    IF v_total_logins IS NULL OR v_total_logins = 0 THEN
      RETURN 'prospect'; -- Nunca logou
    ELSIF v_days_since_login > 60 THEN
      RETURN 'churned'; -- Não acessa há mais de 60 dias
    ELSE
      RETURN 'prospect'; -- Navegando mas sem pedido
    END IF;
  ELSE
    -- Tem pedido ativo
    IF v_days_until_renewal IS NOT NULL AND v_days_until_renewal <= 30 THEN
      RETURN 'renewal_opportunity'; -- Perto de renovar
    ELSIF v_days_since_login > 30 THEN
      RETURN 'at_risk'; -- Tem plano mas não usa
    ELSE
      RETURN 'active_engaged'; -- Cliente ativo e engajado
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 1.6 Índices adicionais para melhorar performance de queries do CRM
CREATE INDEX IF NOT EXISTS idx_client_behavior_last_visit 
  ON client_behavior_analytics(last_visit DESC);

CREATE INDEX IF NOT EXISTS idx_pedidos_client_status_dates
  ON pedidos(client_id, status, data_fim);

CREATE INDEX IF NOT EXISTS idx_tentativas_user_created
  ON tentativas_compra(id_user, created_at DESC);

-- 1.7 RLS Policies para as novas tabelas
ALTER TABLE client_platform_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_activity_events ENABLE ROW LEVEL SECURITY;

-- Admins podem ver tudo
CREATE POLICY admin_view_platform_activity ON client_platform_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY admin_view_activity_events ON client_activity_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Usuários podem ver suas próprias atividades
CREATE POLICY users_view_own_platform_activity ON client_platform_activity
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY users_view_own_activity_events ON client_activity_events
  FOR SELECT USING (user_id = auth.uid());