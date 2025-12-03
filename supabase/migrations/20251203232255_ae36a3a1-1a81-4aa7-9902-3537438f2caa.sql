-- Adicionar campos para pagamento personalizado na tabela proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'standard';
-- 'standard' = parcelamento mensal normal
-- 'custom' = parcelamento personalizado com datas e valores específicos

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS custom_installments JSONB;
-- Armazena array de parcelas: [{"installment": 1, "due_date": "2024-12-03", "amount": 3000}, ...]

-- Índice para consultas por tipo de pagamento
CREATE INDEX IF NOT EXISTS idx_proposals_payment_type ON proposals(payment_type);

COMMENT ON COLUMN proposals.payment_type IS 'Tipo de pagamento: standard (mensal) ou custom (personalizado)';
COMMENT ON COLUMN proposals.custom_installments IS 'Array JSON com parcelas personalizadas: [{installment, due_date, amount}]';