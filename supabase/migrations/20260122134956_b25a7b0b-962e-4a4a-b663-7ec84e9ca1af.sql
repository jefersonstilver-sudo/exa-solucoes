-- Campos para controle de venda futura
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS venda_futura BOOLEAN DEFAULT false;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS predios_contratados INTEGER DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS predios_instalados_no_fechamento INTEGER DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS cortesia_inicio DATE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS cortesia_fim DATE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS meses_cortesia INTEGER DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS predios_pendentes INTEGER DEFAULT 0;

-- Comentários explicativos
COMMENT ON COLUMN proposals.venda_futura IS 'Indica se é uma venda com mais prédios do que os instalados atualmente';
COMMENT ON COLUMN proposals.predios_contratados IS 'Quantidade de prédios que o cliente contratou (pode ser maior que instalados)';
COMMENT ON COLUMN proposals.predios_instalados_no_fechamento IS 'Quantidade de prédios instalados no momento do fechamento';
COMMENT ON COLUMN proposals.cortesia_inicio IS 'Data de início do período de cortesia';
COMMENT ON COLUMN proposals.cortesia_fim IS 'Data em que todos os prédios foram instalados (fim da cortesia)';
COMMENT ON COLUMN proposals.meses_cortesia IS 'Meses de cortesia acumulados (adicionados ao final do contrato)';
COMMENT ON COLUMN proposals.predios_pendentes IS 'Quantidade de prédios ainda não instalados';