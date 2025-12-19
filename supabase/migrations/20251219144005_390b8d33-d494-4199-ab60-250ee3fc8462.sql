-- ============================================
-- MIGRATION: Add cc_emails field for copy notifications
-- ============================================

-- Add cc_emails to proposals table
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS cc_emails text[] DEFAULT '{}';

-- Add cc_emails to pedidos table
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cc_emails text[] DEFAULT '{}';

-- Add cc_emails to users table (for default CC emails per user)
ALTER TABLE users ADD COLUMN IF NOT EXISTS cc_emails text[] DEFAULT '{}';

-- Comment for documentation
COMMENT ON COLUMN proposals.cc_emails IS 'E-mails de cópia para receber notificações da proposta';
COMMENT ON COLUMN pedidos.cc_emails IS 'E-mails de cópia para receber notificações do pedido';
COMMENT ON COLUMN users.cc_emails IS 'E-mails de cópia padrão do usuário para notificações';