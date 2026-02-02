-- Adicionar coluna de valor de referência monetária para propostas de permuta
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS valor_referencia_monetaria numeric(12,2) DEFAULT NULL;

-- Comentário explicativo
COMMENT ON COLUMN proposals.valor_referencia_monetaria IS 'Valor de referência monetária (quanto custaria se fosse monetária) - usado em propostas de permuta para mostrar ao cliente o valor de mercado do pacote';