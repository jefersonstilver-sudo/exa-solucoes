-- Add mercadopago_subscription_id column to pedidos table for recurring card payments
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS mercadopago_subscription_id TEXT;

COMMENT ON COLUMN pedidos.mercadopago_subscription_id IS 'ID da assinatura recorrente no Mercado Pago (Preapproval)';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pedidos_subscription_id ON pedidos(mercadopago_subscription_id) WHERE mercadopago_subscription_id IS NOT NULL;