-- FASE 1: Atualizar tipos de contato específicos do negócio
DELETE FROM contact_types WHERE is_default = true;

INSERT INTO contact_types (name, label, color, icon, is_default) VALUES
('anunciante', 'Anunciante', '#10b981', 'megaphone', true),
('sindico', 'Síndico', '#3b82f6', 'building', true),
('morador', 'Morador', '#eab308', 'user', true),
('suporte_tecnico', 'Suporte Técnico', '#ef4444', 'wrench', true),
('cliente_ativo', 'Cliente Ativo', '#a855f7', 'check-circle', true);

-- FASE 2: Criar tabela lead_profiles para dados extraídos pela IA
CREATE TABLE IF NOT EXISTS lead_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Dados para ANUNCIANTES
  empresa_nome TEXT,
  segmento TEXT,
  bairro_interesse TEXT,
  predios_desejados INTEGER,
  intencao TEXT CHECK (intencao IN ('baixa', 'media', 'alta')),
  orcamento_estimado NUMERIC(10,2),
  estagio_compra TEXT CHECK (estagio_compra IN ('consultando', 'orcamento', 'decidindo', 'comprando')),
  
  -- Dados para SÍNDICOS
  predio_nome TEXT,
  predio_andares INTEGER,
  predio_unidades INTEGER,
  predio_tipo TEXT CHECK (predio_tipo IN ('residencial', 'comercial', 'misto')),
  administradora TEXT,
  interesse_real BOOLEAN,
  
  -- Campos comuns
  probabilidade_fechamento INTEGER CHECK (probabilidade_fechamento >= 0 AND probabilidade_fechamento <= 100),
  urgencia TEXT CHECK (urgencia IN ('baixa', 'media', 'alta', 'critica')),
  necessita_escalacao BOOLEAN DEFAULT false,
  motivo_escalacao TEXT,
  is_hot_lead BOOLEAN DEFAULT false,
  hot_lead_score INTEGER DEFAULT 0,
  proximos_passos JSONB,
  objecoes_identificadas TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(conversation_id)
);

-- Índices para performance
CREATE INDEX idx_lead_profiles_conversation ON lead_profiles(conversation_id);
CREATE INDEX idx_lead_profiles_hot_lead ON lead_profiles(is_hot_lead) WHERE is_hot_lead = true;
CREATE INDEX idx_lead_profiles_urgencia ON lead_profiles(urgencia);
CREATE INDEX idx_lead_profiles_necessita_escalacao ON lead_profiles(necessita_escalacao) WHERE necessita_escalacao = true;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_lead_profiles_updated_at
  BEFORE UPDATE ON lead_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE lead_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all lead profiles"
  ON lead_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert lead profiles"
  ON lead_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update lead profiles"
  ON lead_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

COMMENT ON TABLE lead_profiles IS 'Perfis de leads extraídos automaticamente pela IA das conversas';
COMMENT ON COLUMN lead_profiles.hot_lead_score IS 'Pontuação calculada automaticamente: ≥70 = Hot Lead';
COMMENT ON COLUMN lead_profiles.proximos_passos IS 'Array de próximos passos recomendados pela IA';
COMMENT ON COLUMN lead_profiles.objecoes_identificadas IS 'Objeções identificadas pela IA na conversa';