-- Remove coluna específica do MercadoPago (se existir)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' AND column_name = 'mercadopago_transaction_id'
    ) THEN
        ALTER TABLE pedidos DROP COLUMN mercadopago_transaction_id;
    END IF;
END $$;

-- Adicionar índice para busca rápida por checkout_session_id do Stripe
CREATE INDEX IF NOT EXISTS idx_pedidos_log_pagamento_checkout_session 
ON pedidos USING gin ((log_pagamento -> 'checkout_session_id'));