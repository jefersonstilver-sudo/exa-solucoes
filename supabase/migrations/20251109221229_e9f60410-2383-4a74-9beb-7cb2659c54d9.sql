-- ============================================
-- TABELA DE CUSTOMIZAÇÕES DE EMAIL TEMPLATES
-- ============================================

-- Drop policies if they exist
DROP POLICY IF EXISTS "Admins can view customizations" ON email_template_customizations;
DROP POLICY IF EXISTS "Admins can insert customizations" ON email_template_customizations;
DROP POLICY IF EXISTS "Admins can update customizations" ON email_template_customizations;
DROP POLICY IF EXISTS "Super admins can delete customizations" ON email_template_customizations;

-- Criar tabela de customizações
CREATE TABLE IF NOT EXISTS email_template_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL UNIQUE,
  custom_html TEXT,
  custom_subject TEXT,
  custom_colors JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_email_customizations_template_id ON email_template_customizations(template_id);
CREATE INDEX IF NOT EXISTS idx_email_customizations_active ON email_template_customizations(is_active);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_email_customizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS email_customizations_updated_at ON email_template_customizations;
CREATE TRIGGER email_customizations_updated_at
  BEFORE UPDATE ON email_template_customizations
  FOR EACH ROW
  EXECUTE FUNCTION update_email_customizations_updated_at();

-- RLS Policies
ALTER TABLE email_template_customizations ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as customizações
CREATE POLICY "Admins can view customizations"
  ON email_template_customizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'admin_marketing')
    )
  );

-- Admins podem inserir customizações
CREATE POLICY "Admins can insert customizations"
  ON email_template_customizations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'admin_marketing')
    )
  );

-- Admins podem atualizar customizações
CREATE POLICY "Admins can update customizations"
  ON email_template_customizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'admin_marketing')
    )
  );

-- Super admins podem deletar
CREATE POLICY "Super admins can delete customizations"
  ON email_template_customizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Comentários
COMMENT ON TABLE email_template_customizations IS 'Customizações salvas dos templates de email';
COMMENT ON COLUMN email_template_customizations.template_id IS 'ID do template (confirmation, video_approved, etc)';
COMMENT ON COLUMN email_template_customizations.custom_html IS 'HTML customizado completo do template';
COMMENT ON COLUMN email_template_customizations.custom_subject IS 'Subject line customizado';
COMMENT ON COLUMN email_template_customizations.is_active IS 'Se a customização está ativa (será usada nos envios)';