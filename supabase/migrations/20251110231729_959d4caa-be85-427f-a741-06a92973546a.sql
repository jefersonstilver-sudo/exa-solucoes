-- Criar tabela para logs de webhook PIX
CREATE TABLE IF NOT EXISTS webhook_pix_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  pedido_id UUID,
  request_data JSONB,
  response_data JSONB,
  response_status INT,
  error_message TEXT,
  success BOOLEAN,
  webhook_url TEXT,
  user_id UUID REFERENCES auth.users(id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_webhook_pix_logs_created_at ON webhook_pix_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_pix_logs_pedido_id ON webhook_pix_logs(pedido_id);
CREATE INDEX IF NOT EXISTS idx_webhook_pix_logs_success ON webhook_pix_logs(success);
CREATE INDEX IF NOT EXISTS idx_webhook_pix_logs_user_id ON webhook_pix_logs(user_id);

-- RLS para admins e usuários verem seus próprios logs
ALTER TABLE webhook_pix_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver todos os logs de webhook"
ON webhook_pix_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Usuários podem ver seus próprios logs de webhook"
ON webhook_pix_logs FOR SELECT
USING (user_id = auth.uid());

-- Apenas o sistema pode inserir logs (via service role)
CREATE POLICY "Sistema pode inserir logs de webhook"
ON webhook_pix_logs FOR INSERT
WITH CHECK (true);