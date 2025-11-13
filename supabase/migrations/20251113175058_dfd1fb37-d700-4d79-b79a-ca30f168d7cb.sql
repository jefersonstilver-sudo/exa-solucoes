-- FASE 1: MIGRAÇÃO COMPLETA PARA STRIPE
-- Adicionar coluna checkout_session_id para integração Stripe

-- 1. Adicionar coluna checkout_session_id
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS checkout_session_id TEXT;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_checkout_session 
ON pedidos(checkout_session_id);

-- 3. Criar índice para transaction_id (se não existir)
CREATE INDEX IF NOT EXISTS idx_pedidos_transaction_id 
ON pedidos(transaction_id);

-- 4. Adicionar comentário para documentação
COMMENT ON COLUMN pedidos.checkout_session_id IS 'Stripe Checkout Session ID - usado para rastrear sessões de pagamento';