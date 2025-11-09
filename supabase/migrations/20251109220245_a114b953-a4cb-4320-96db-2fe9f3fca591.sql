-- ============================================
-- TABELA DE LOGS DE EMAIL
-- ============================================

-- Criar tabela de logs de email
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  resend_id TEXT,
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_id ON email_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON email_logs(resend_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS email_logs_updated_at ON email_logs;
CREATE TRIGGER email_logs_updated_at
  BEFORE UPDATE ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_email_logs_updated_at();

-- RLS Policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Super admins e admins podem ver todos os logs
CREATE POLICY "Admins can view email logs"
  ON email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'admin_marketing')
    )
  );

-- Sistema pode inserir logs (usado pelas edge functions)
CREATE POLICY "System can insert email logs"
  ON email_logs
  FOR INSERT
  WITH CHECK (true);

-- Sistema pode atualizar logs (usado pelos webhooks)
CREATE POLICY "System can update email logs"
  ON email_logs
  FOR UPDATE
  USING (true);

-- Comentários para documentação
COMMENT ON TABLE email_logs IS 'Registro de todos os emails enviados pelo sistema com rastreamento de eventos';
COMMENT ON COLUMN email_logs.template_id IS 'ID do template usado (confirmation, video_approved, etc)';
COMMENT ON COLUMN email_logs.status IS 'Status atual do email: sent, delivered, opened, clicked, failed, bounced';
COMMENT ON COLUMN email_logs.resend_id IS 'ID retornado pelo Resend para rastreamento via webhook';
COMMENT ON COLUMN email_logs.metadata IS 'Dados adicionais não sensíveis (ex: campaign_id, user_id)';