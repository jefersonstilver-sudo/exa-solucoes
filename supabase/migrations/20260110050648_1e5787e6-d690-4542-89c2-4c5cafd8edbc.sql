-- Adicionar colunas para suporte a Pix Automático
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS asaas_authorization_id TEXT;

-- Comentário para documentação
COMMENT ON COLUMN pedidos.asaas_authorization_id IS 'ID da autorização de débito automático PIX do Asaas';