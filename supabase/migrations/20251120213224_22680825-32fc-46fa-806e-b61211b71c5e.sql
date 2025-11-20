-- Criar tabela de analytics de conversas

CREATE TABLE IF NOT EXISTS conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  agent_key TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  
  -- Métricas
  message_count INTEGER DEFAULT 1,
  session_start TIMESTAMPTZ DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  session_duration_seconds INTEGER,
  
  -- Qualificação
  lead_qualified BOOLEAN DEFAULT FALSE,
  lead_score INTEGER DEFAULT 0,
  lead_type TEXT,
  interest_level TEXT,
  
  -- Comportamento
  response_time_avg_ms INTEGER,
  user_initiated BOOLEAN DEFAULT TRUE,
  
  -- Conversão
  converted BOOLEAN DEFAULT FALSE,
  conversion_type TEXT,
  converted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_conversation_analytics UNIQUE (conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_analytics_agent ON conversation_analytics(agent_key);
CREATE INDEX IF NOT EXISTS idx_analytics_phone ON conversation_analytics(phone_number);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON conversation_analytics(session_start);

-- Função para incrementar analytics
CREATE OR REPLACE FUNCTION increment_conversation_analytics(
  p_conversation_id UUID,
  p_agent_key TEXT,
  p_phone TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO conversation_analytics (
    conversation_id, agent_key, phone_number, message_count
  )
  VALUES (
    p_conversation_id, p_agent_key, p_phone, 1
  )
  ON CONFLICT (conversation_id)
  DO UPDATE SET
    message_count = conversation_analytics.message_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
