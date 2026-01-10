-- Adicionar colunas para suporte a assinaturas na tabela pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT FALSE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;

-- Índice para buscas por subscription
CREATE INDEX IF NOT EXISTS idx_pedidos_asaas_subscription_id ON pedidos(asaas_subscription_id) WHERE asaas_subscription_id IS NOT NULL;

-- Comentários
COMMENT ON COLUMN pedidos.is_subscription IS 'Indica se o pedido é uma assinatura recorrente';
COMMENT ON COLUMN pedidos.asaas_subscription_id IS 'ID da assinatura no Asaas para pagamentos recorrentes';