-- ============================================
-- EXA ALERTS - Sistema de Alertas Inteligentes
-- ============================================

-- 1. Tabela de Diretores Autorizados
CREATE TABLE IF NOT EXISTS exa_alerts_directors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL UNIQUE,
  departamento TEXT,
  nivel_acesso TEXT DEFAULT 'basico' CHECK (nivel_acesso IN ('basico', 'gerente', 'admin')),
  ativo BOOLEAN DEFAULT true,
  pode_usar_ia BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Configurações Globais
CREATE TABLE IF NOT EXISTS exa_alerts_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Regras de Alertas
CREATE TABLE IF NOT EXISTS exa_alerts_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('painel_offline', 'comportamental', 'relatorio', 'custom')),
  gatilho JSONB NOT NULL,
  destinatarios JSONB NOT NULL,
  template_mensagem TEXT NOT NULL,
  horario_silencio_inicio TIME,
  horario_silencio_fim TIME,
  ativo BOOLEAN DEFAULT true,
  escalonamento JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Histórico de Alertas
CREATE TABLE IF NOT EXISTS exa_alerts_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES exa_alerts_rules(id) ON DELETE SET NULL,
  tipo_alerta TEXT NOT NULL,
  destinatario_telefone TEXT NOT NULL,
  destinatario_nome TEXT,
  mensagem_enviada TEXT NOT NULL,
  status TEXT DEFAULT 'enviado' CHECK (status IN ('enviado', 'entregue', 'lido', 'respondido', 'erro')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  response TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_exa_alerts_directors_telefone ON exa_alerts_directors(telefone);
CREATE INDEX IF NOT EXISTS idx_exa_alerts_directors_ativo ON exa_alerts_directors(ativo);
CREATE INDEX IF NOT EXISTS idx_exa_alerts_config_key ON exa_alerts_config(config_key);
CREATE INDEX IF NOT EXISTS idx_exa_alerts_rules_tipo ON exa_alerts_rules(tipo);
CREATE INDEX IF NOT EXISTS idx_exa_alerts_rules_ativo ON exa_alerts_rules(ativo);
CREATE INDEX IF NOT EXISTS idx_exa_alerts_history_created_at ON exa_alerts_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exa_alerts_history_status ON exa_alerts_history(status);
CREATE INDEX IF NOT EXISTS idx_exa_alerts_history_rule_id ON exa_alerts_history(rule_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_exa_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_exa_alerts_directors_updated_at
  BEFORE UPDATE ON exa_alerts_directors
  FOR EACH ROW
  EXECUTE FUNCTION update_exa_alerts_updated_at();

CREATE TRIGGER trigger_exa_alerts_config_updated_at
  BEFORE UPDATE ON exa_alerts_config
  FOR EACH ROW
  EXECUTE FUNCTION update_exa_alerts_updated_at();

CREATE TRIGGER trigger_exa_alerts_rules_updated_at
  BEFORE UPDATE ON exa_alerts_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_exa_alerts_updated_at();

-- Configurações iniciais padrão
INSERT INTO exa_alerts_config (config_key, config_value, descricao) VALUES
  ('silence_period', '{"inicio": "03:00", "fim": "01:00", "timezone": "America/Sao_Paulo"}', 'Período de silêncio dos alertas'),
  ('templates', '{
    "painel_offline": "🔴 Painel {painel_nome} em {predio} está OFFLINE desde {tempo}. Ação necessária!",
    "painel_online": "🟢 Painel {painel_nome} retornou online em {hora}.",
    "alerta_critico": "⚠️ ALERTA CRÍTICO: {mensagem}"
  }', 'Templates de mensagem padrão')
ON CONFLICT (config_key) DO NOTHING;

-- RLS Policies (apenas super_admins)
ALTER TABLE exa_alerts_directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE exa_alerts_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE exa_alerts_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE exa_alerts_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins têm acesso total - directors"
  ON exa_alerts_directors
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins têm acesso total - config"
  ON exa_alerts_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins têm acesso total - rules"
  ON exa_alerts_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins têm acesso total - history"
  ON exa_alerts_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );