-- =====================================================
-- SISTEMA DE ALERTAS DE PAINEL OFFLINE
-- =====================================================

-- 1. Adicionar coluna de horário de funcionamento na tabela painels
ALTER TABLE painels ADD COLUMN IF NOT EXISTS horario_funcionamento JSONB DEFAULT '{"inicio": "04:00", "fim": "00:00", "herdar_predio": false}';

-- 2. Adicionar coluna de horário padrão na tabela buildings (para herança)
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS horario_funcionamento_padrao JSONB DEFAULT '{"inicio": "04:00", "fim": "00:00"}';

-- 3. Adicionar colunas de controle de alertas na tabela painels
ALTER TABLE painels ADD COLUMN IF NOT EXISTS last_offline_alert_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE painels ADD COLUMN IF NOT EXISTS offline_alert_count INTEGER DEFAULT 0;

-- 4. Criar tabela para destinatários de alertas de painel offline
CREATE TABLE IF NOT EXISTS panel_offline_alert_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Criar tabela para configuração do alerta de painel offline
CREATE TABLE IF NOT EXISTS panel_offline_alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ativo BOOLEAN DEFAULT true,
  tempo_offline_minutos INTEGER DEFAULT 10,
  repetir_ate_resolver BOOLEAN DEFAULT true,
  intervalo_repeticao_minutos INTEGER DEFAULT 30,
  notificar_quando_online BOOLEAN DEFAULT true,
  horario_silencio_inicio TIME DEFAULT NULL,
  horario_silencio_fim TIME DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Inserir configuração padrão se não existir
INSERT INTO panel_offline_alert_config (
  ativo,
  tempo_offline_minutos,
  repetir_ate_resolver,
  intervalo_repeticao_minutos,
  notificar_quando_online
) 
SELECT true, 10, true, 30, true
WHERE NOT EXISTS (SELECT 1 FROM panel_offline_alert_config LIMIT 1);

-- 7. Habilitar RLS nas novas tabelas
ALTER TABLE panel_offline_alert_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_offline_alert_config ENABLE ROW LEVEL SECURITY;

-- 8. Políticas RLS para panel_offline_alert_recipients
CREATE POLICY "Admins can manage offline alert recipients"
ON panel_offline_alert_recipients
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- 9. Políticas RLS para panel_offline_alert_config
CREATE POLICY "Admins can manage offline alert config"
ON panel_offline_alert_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- 10. Criar tabela para histórico de alertas de painel offline
CREATE TABLE IF NOT EXISTS panel_offline_alerts_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  painel_id UUID REFERENCES painels(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'offline' ou 'online'
  mensagem TEXT,
  tempo_offline_minutos INTEGER,
  destinatarios_notificados JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Habilitar RLS e políticas para histórico
ALTER TABLE panel_offline_alerts_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view offline alerts history"
ON panel_offline_alerts_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "System can insert offline alerts history"
ON panel_offline_alerts_history
FOR INSERT
WITH CHECK (true);