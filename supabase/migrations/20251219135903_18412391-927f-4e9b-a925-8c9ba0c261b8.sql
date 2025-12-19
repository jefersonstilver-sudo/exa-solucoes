-- Sofia Admin Sessions - Gerencia sessões administrativas com 2FA
CREATE TABLE public.sofia_admin_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_phone TEXT NOT NULL,
    user_name TEXT,
    verification_code TEXT NOT NULL,
    code_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    code_verified_at TIMESTAMP WITH TIME ZONE,
    session_active BOOLEAN DEFAULT false,
    session_expires_at TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para busca rápida por telefone e código
CREATE INDEX idx_sofia_admin_sessions_phone ON public.sofia_admin_sessions(user_phone);
CREATE INDEX idx_sofia_admin_sessions_code ON public.sofia_admin_sessions(verification_code);
CREATE INDEX idx_sofia_admin_sessions_active ON public.sofia_admin_sessions(session_active, session_expires_at);

-- Sofia Admin Access Logs - Auditoria de consultas administrativas
CREATE TABLE public.sofia_admin_access_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sofia_admin_sessions(id),
    query_type TEXT NOT NULL,
    query_params JSONB DEFAULT '{}'::jsonb,
    response_summary TEXT,
    response_data JSONB DEFAULT '{}'::jsonb,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para auditoria
CREATE INDEX idx_sofia_admin_access_logs_session ON public.sofia_admin_access_logs(session_id);
CREATE INDEX idx_sofia_admin_access_logs_created ON public.sofia_admin_access_logs(created_at DESC);

-- Conversation Heat Metrics - Métricas de calor de conversas
CREATE TABLE public.conversation_heat_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    heat_score INTEGER DEFAULT 0,
    risk_level TEXT DEFAULT 'low',
    risk_factors JSONB DEFAULT '[]'::jsonb,
    engagement_score INTEGER DEFAULT 0,
    response_time_avg_minutes INTEGER,
    message_count INTEGER DEFAULT 0,
    last_customer_message_at TIMESTAMP WITH TIME ZONE,
    last_agent_response_at TIMESTAMP WITH TIME ZONE,
    days_without_response INTEGER DEFAULT 0,
    negative_keywords_detected JSONB DEFAULT '[]'::jsonb,
    potential_value DECIMAL(10,2),
    conversion_probability INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(conversation_id)
);

-- Indexes para métricas
CREATE INDEX idx_conversation_heat_metrics_heat ON public.conversation_heat_metrics(heat_score DESC);
CREATE INDEX idx_conversation_heat_metrics_risk ON public.conversation_heat_metrics(risk_level);
CREATE INDEX idx_conversation_heat_metrics_updated ON public.conversation_heat_metrics(last_calculated_at);

-- Enable RLS
ALTER TABLE public.sofia_admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sofia_admin_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_heat_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Sofia Admin Sessions
CREATE POLICY "Service role full access to sofia_admin_sessions"
ON public.sofia_admin_sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies - Sofia Admin Access Logs
CREATE POLICY "Service role full access to sofia_admin_access_logs"
ON public.sofia_admin_access_logs
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view sofia admin logs"
ON public.sofia_admin_access_logs
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() 
    AND users.role IN ('super_admin', 'admin')
));

-- RLS Policies - Conversation Heat Metrics
CREATE POLICY "Service role full access to conversation_heat_metrics"
ON public.conversation_heat_metrics
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view conversation heat metrics"
ON public.conversation_heat_metrics
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() 
    AND users.role IN ('super_admin', 'admin')
));

-- Function to calculate conversation heat score
CREATE OR REPLACE FUNCTION public.calculate_conversation_heat(conv_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    heat_score INTEGER := 0;
    msg_count INTEGER;
    last_customer_msg TIMESTAMP WITH TIME ZONE;
    last_agent_msg TIMESTAMP WITH TIME ZONE;
    hours_without_response INTEGER;
    has_negative_keywords BOOLEAN;
    conv_status TEXT;
BEGIN
    -- Get conversation info
    SELECT status INTO conv_status FROM conversations WHERE id = conv_id;
    
    -- Count messages
    SELECT COUNT(*) INTO msg_count FROM messages WHERE conversation_id = conv_id;
    
    -- Get last customer message
    SELECT MAX(created_at) INTO last_customer_msg 
    FROM messages 
    WHERE conversation_id = conv_id AND direction = 'inbound';
    
    -- Get last agent response
    SELECT MAX(created_at) INTO last_agent_msg 
    FROM messages 
    WHERE conversation_id = conv_id AND direction = 'outbound';
    
    -- Calculate hours without response
    IF last_customer_msg IS NOT NULL AND (last_agent_msg IS NULL OR last_customer_msg > last_agent_msg) THEN
        hours_without_response := EXTRACT(EPOCH FROM (now() - last_customer_msg)) / 3600;
    ELSE
        hours_without_response := 0;
    END IF;
    
    -- Check for negative keywords
    SELECT EXISTS(
        SELECT 1 FROM messages 
        WHERE conversation_id = conv_id 
        AND direction = 'inbound'
        AND (
            body ILIKE '%cancelar%' OR 
            body ILIKE '%desistir%' OR 
            body ILIKE '%não quero%' OR
            body ILIKE '%caro demais%' OR
            body ILIKE '%problema%' OR
            body ILIKE '%reclamar%'
        )
    ) INTO has_negative_keywords;
    
    -- Base score from message activity (max 30)
    heat_score := LEAST(msg_count * 3, 30);
    
    -- Bonus for recent activity (max 20)
    IF last_customer_msg > now() - INTERVAL '1 hour' THEN
        heat_score := heat_score + 20;
    ELSIF last_customer_msg > now() - INTERVAL '6 hours' THEN
        heat_score := heat_score + 15;
    ELSIF last_customer_msg > now() - INTERVAL '24 hours' THEN
        heat_score := heat_score + 10;
    END IF;
    
    -- Penalty for waiting response (max -30)
    IF hours_without_response > 24 THEN
        heat_score := heat_score - 30;
    ELSIF hours_without_response > 6 THEN
        heat_score := heat_score - 15;
    ELSIF hours_without_response > 1 THEN
        heat_score := heat_score - 5;
    END IF;
    
    -- Bonus/penalty for status
    IF conv_status = 'active' THEN
        heat_score := heat_score + 10;
    ELSIF conv_status = 'closed' THEN
        heat_score := heat_score - 20;
    END IF;
    
    -- Penalty for negative keywords
    IF has_negative_keywords THEN
        heat_score := heat_score - 15;
    END IF;
    
    -- Ensure score is between 0 and 100
    heat_score := GREATEST(0, LEAST(100, heat_score));
    
    RETURN heat_score;
END;
$$;

-- Function to update heat metrics for a conversation
CREATE OR REPLACE FUNCTION public.update_conversation_heat_metrics(conv_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    calc_heat_score INTEGER;
    calc_risk_level TEXT;
    calc_risk_factors JSONB;
    msg_count INTEGER;
    last_customer_msg TIMESTAMP WITH TIME ZONE;
    last_agent_msg TIMESTAMP WITH TIME ZONE;
    hours_without_response NUMERIC;
BEGIN
    -- Calculate heat score
    calc_heat_score := calculate_conversation_heat(conv_id);
    
    -- Get message count
    SELECT COUNT(*) INTO msg_count FROM messages WHERE conversation_id = conv_id;
    
    -- Get timestamps
    SELECT MAX(created_at) INTO last_customer_msg 
    FROM messages WHERE conversation_id = conv_id AND direction = 'inbound';
    
    SELECT MAX(created_at) INTO last_agent_msg 
    FROM messages WHERE conversation_id = conv_id AND direction = 'outbound';
    
    -- Calculate hours without response
    IF last_customer_msg IS NOT NULL AND (last_agent_msg IS NULL OR last_customer_msg > last_agent_msg) THEN
        hours_without_response := EXTRACT(EPOCH FROM (now() - last_customer_msg)) / 3600;
    ELSE
        hours_without_response := 0;
    END IF;
    
    -- Determine risk level
    IF calc_heat_score >= 70 THEN
        calc_risk_level := 'hot';
    ELSIF calc_heat_score >= 50 THEN
        calc_risk_level := 'warm';
    ELSIF calc_heat_score >= 30 THEN
        calc_risk_level := 'medium';
    ELSIF calc_heat_score >= 10 THEN
        calc_risk_level := 'low';
    ELSE
        calc_risk_level := 'cold';
    END IF;
    
    -- Build risk factors
    calc_risk_factors := '[]'::jsonb;
    
    IF hours_without_response > 24 THEN
        calc_risk_factors := calc_risk_factors || '["Sem resposta há mais de 24h"]'::jsonb;
    ELSIF hours_without_response > 6 THEN
        calc_risk_factors := calc_risk_factors || '["Aguardando resposta há mais de 6h"]'::jsonb;
    END IF;
    
    -- Check for negative keywords
    IF EXISTS(
        SELECT 1 FROM messages 
        WHERE conversation_id = conv_id 
        AND direction = 'inbound'
        AND created_at > now() - INTERVAL '7 days'
        AND (
            body ILIKE '%cancelar%' OR 
            body ILIKE '%desistir%' OR 
            body ILIKE '%não quero%'
        )
    ) THEN
        calc_risk_factors := calc_risk_factors || '["Keywords negativas detectadas"]'::jsonb;
    END IF;
    
    -- Upsert metrics
    INSERT INTO conversation_heat_metrics (
        conversation_id,
        heat_score,
        risk_level,
        risk_factors,
        message_count,
        last_customer_message_at,
        last_agent_response_at,
        days_without_response,
        last_calculated_at,
        updated_at
    ) VALUES (
        conv_id,
        calc_heat_score,
        calc_risk_level,
        calc_risk_factors,
        msg_count,
        last_customer_msg,
        last_agent_msg,
        FLOOR(hours_without_response / 24),
        now(),
        now()
    )
    ON CONFLICT (conversation_id) DO UPDATE SET
        heat_score = EXCLUDED.heat_score,
        risk_level = EXCLUDED.risk_level,
        risk_factors = EXCLUDED.risk_factors,
        message_count = EXCLUDED.message_count,
        last_customer_message_at = EXCLUDED.last_customer_message_at,
        last_agent_response_at = EXCLUDED.last_agent_response_at,
        days_without_response = EXCLUDED.days_without_response,
        last_calculated_at = EXCLUDED.last_calculated_at,
        updated_at = EXCLUDED.updated_at;
END;
$$;

-- Trigger to auto-update heat metrics when messages are inserted
CREATE OR REPLACE FUNCTION public.trigger_update_heat_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM update_conversation_heat_metrics(NEW.conversation_id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_heat_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION trigger_update_heat_metrics();

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.calculate_conversation_heat(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_conversation_heat_metrics(UUID) TO authenticated;