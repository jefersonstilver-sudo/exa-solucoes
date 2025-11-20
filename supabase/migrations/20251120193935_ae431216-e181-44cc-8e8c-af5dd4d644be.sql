-- ============================================
-- ETAPA 1: FUNDAÇÃO DO BANCO DE DADOS
-- CRM Unificado Multi-Agente
-- ============================================

-- 1.1 Atualizar tabela conversations com tracking inteligente
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS agent_key TEXT DEFAULT 'sofia',
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'zapi',
ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT 'neutral',
ADD COLUMN IF NOT EXISTS urgency_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mood_score INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_sindico BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_hot_lead BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS awaiting_response BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_response_time INTERVAL,
ADD COLUMN IF NOT EXISTS avg_response_time INTERVAL,
ADD COLUMN IF NOT EXISTS escalated_to_eduardo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS alerted_exa BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reported_to_iris BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversations_agent ON conversations(agent_key);
CREATE INDEX IF NOT EXISTS idx_conversations_provider ON conversations(provider);
CREATE INDEX IF NOT EXISTS idx_conversations_is_hot_lead ON conversations(is_hot_lead) WHERE is_hot_lead = true;
CREATE INDEX IF NOT EXISTS idx_conversations_is_critical ON conversations(is_critical) WHERE is_critical = true;
CREATE INDEX IF NOT EXISTS idx_conversations_awaiting ON conversations(awaiting_response) WHERE awaiting_response = true;
CREATE INDEX IF NOT EXISTS idx_conversations_sentiment ON conversations(sentiment);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(last_message_at DESC);

-- 1.2 Atualizar tabela messages com campos de análise
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS agent_key TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT,
ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'inbound',
ADD COLUMN IF NOT EXISTS sentiment TEXT,
ADD COLUMN IF NOT EXISTS detected_urgency INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS detected_mood INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS intent TEXT,
ADD COLUMN IF NOT EXISTS classification JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS response_time INTERVAL,
ADD COLUMN IF NOT EXISTS is_automated BOOLEAN DEFAULT false;

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_agent ON messages(agent_key);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
CREATE INDEX IF NOT EXISTS idx_messages_sentiment ON messages(sentiment);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- 1.3 Criar tabela conversation_events para tracking de orquestração
CREATE TABLE IF NOT EXISTS conversation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  from_agent TEXT,
  to_agent TEXT,
  severity TEXT DEFAULT 'info',
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_conversation ON conversation_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON conversation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON conversation_events(created_at DESC);

-- 1.4 Criar tabela quick_replies
CREATE TABLE IF NOT EXISTS quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quick_replies_agent ON quick_replies(agent_key);
CREATE INDEX IF NOT EXISTS idx_quick_replies_active ON quick_replies(is_active) WHERE is_active = true;

-- 1.5 Trigger para atualizar timestamps de conversations
CREATE OR REPLACE FUNCTION update_conversation_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    awaiting_response = CASE 
      WHEN NEW.direction = 'inbound' THEN true
      ELSE false
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
CREATE TRIGGER trigger_update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamps();

-- 1.6 Função para calcular tempo de resposta
CREATE OR REPLACE FUNCTION calculate_response_time()
RETURNS TRIGGER AS $$
DECLARE
  prev_inbound_msg RECORD;
BEGIN
  IF NEW.direction = 'outbound' THEN
    -- Buscar última mensagem inbound da mesma conversa
    SELECT * INTO prev_inbound_msg
    FROM messages
    WHERE conversation_id = NEW.conversation_id
      AND direction = 'inbound'
      AND created_at < NEW.created_at
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF prev_inbound_msg.id IS NOT NULL THEN
      NEW.response_time := NEW.created_at - prev_inbound_msg.created_at;
      
      -- Atualizar avg_response_time na conversation
      UPDATE conversations
      SET 
        last_response_time = NEW.response_time,
        avg_response_time = (
          SELECT AVG(response_time)
          FROM messages
          WHERE conversation_id = NEW.conversation_id
            AND response_time IS NOT NULL
        )
      WHERE id = NEW.conversation_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_response_time ON messages;
CREATE TRIGGER trigger_calculate_response_time
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION calculate_response_time();

-- 1.7 RLS Policies para conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_read_conversations" ON conversations;
CREATE POLICY "authenticated_read_conversations"
ON conversations FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "system_manage_conversations" ON conversations;
CREATE POLICY "system_manage_conversations"
ON conversations FOR ALL
TO service_role
USING (true);

-- 1.8 RLS Policies para messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_read_messages" ON messages;
CREATE POLICY "authenticated_read_messages"
ON messages FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "system_manage_messages" ON messages;
CREATE POLICY "system_manage_messages"
ON messages FOR ALL
TO service_role
USING (true);

-- 1.9 RLS Policies para conversation_events
ALTER TABLE conversation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_read_events" ON conversation_events;
CREATE POLICY "authenticated_read_events"
ON conversation_events FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "system_insert_events" ON conversation_events;
CREATE POLICY "system_insert_events"
ON conversation_events FOR INSERT
TO service_role
WITH CHECK (true);

-- 1.10 RLS Policies para quick_replies
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_read_quick_replies" ON quick_replies;
CREATE POLICY "authenticated_read_quick_replies"
ON quick_replies FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "authenticated_manage_quick_replies" ON quick_replies;
CREATE POLICY "authenticated_manage_quick_replies"
ON quick_replies FOR ALL
TO authenticated
USING (true);

-- 1.11 Inserir quick replies padrão para cada agente
INSERT INTO quick_replies (agent_key, title, content, category) VALUES
('sofia', 'Saudação', 'Olá! Sou a Sofia, assistente comercial da INDEXA. Como posso ajudar você hoje?', 'greeting'),
('sofia', 'Solicitar informações', 'Para prosseguir com sua solicitação, preciso de algumas informações. Poderia me fornecer mais detalhes?', 'followup'),
('sofia', 'Objeção - Preço', 'Entendo sua preocupação com o investimento. Nossos painéis oferecem excelente custo-benefício com alcance comprovado. Gostaria de ver casos de sucesso?', 'objection'),
('eduardo', 'Saudação Lead Quente', 'Olá! Vi que você demonstrou interesse em nossos painéis. Sou o Eduardo, da equipe comercial. Vamos conversar sobre a melhor solução para você?', 'greeting'),
('eduardo', 'Agendamento', 'Perfeito! Podemos agendar uma reunião para apresentar nossa proposta em detalhes. Qual seria o melhor dia e horário para você?', 'followup'),
('iris', 'Relatório Solicitado', 'Relatório gerado com sucesso. Aqui estão os principais indicadores que você solicitou:', 'technical')
ON CONFLICT DO NOTHING;