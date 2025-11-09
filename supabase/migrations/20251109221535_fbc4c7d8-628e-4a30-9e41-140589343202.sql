-- Tabela de histórico de versões de templates
CREATE TABLE IF NOT EXISTS email_template_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  custom_html TEXT NOT NULL,
  custom_subject TEXT,
  version_number INTEGER NOT NULL,
  saved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_description TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_email_history_template_id ON email_template_history(template_id);
CREATE INDEX IF NOT EXISTS idx_email_history_created_at ON email_template_history(created_at DESC);

-- RLS Policies
ALTER TABLE email_template_history ENABLE ROW LEVEL SECURITY;

-- Admins podem ver histórico
CREATE POLICY "Admins can view history"
  ON email_template_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'admin_marketing')
    )
  );

-- Sistema pode inserir histórico
CREATE POLICY "System can insert history"
  ON email_template_history
  FOR INSERT
  WITH CHECK (true);

-- Super admins podem deletar histórico
CREATE POLICY "Super admins can delete history"
  ON email_template_history
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

COMMENT ON TABLE email_template_history IS 'Histórico completo de versões dos templates de email';
COMMENT ON COLUMN email_template_history.version_number IS 'Número sequencial da versão para cada template';