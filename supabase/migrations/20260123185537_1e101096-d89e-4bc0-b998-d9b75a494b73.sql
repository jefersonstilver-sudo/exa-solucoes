-- Adicionar campo para armazenar o modo de cálculo do travamento
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS travamento_modo_calculo text DEFAULT 'automatico';
ALTER TABLE contratos_legais ADD COLUMN IF NOT EXISTS travamento_modo_calculo text DEFAULT 'automatico';

-- Comentários para documentação
COMMENT ON COLUMN proposals.travamento_modo_calculo IS 'Modo de cálculo: automatico (baseado na proposta) ou manual (valor definido pelo vendedor)';
COMMENT ON COLUMN contratos_legais.travamento_modo_calculo IS 'Modo de cálculo: automatico (baseado na proposta) ou manual (valor definido pelo vendedor)';