-- Adicionar colunas de multa da EXA na tabela proposals
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS multa_rescisao_exa_ativa boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS multa_rescisao_exa_percentual numeric DEFAULT 20;

-- Adicionar colunas de multa da EXA na tabela contratos_legais
ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS multa_rescisao_exa_ativa boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS multa_rescisao_exa_percentual numeric DEFAULT 20;

-- Comentários descritivos
COMMENT ON COLUMN proposals.multa_rescisao_exa_ativa IS 'Se a multa rescisória da CONTRATADA (EXA) está ativa';
COMMENT ON COLUMN proposals.multa_rescisao_exa_percentual IS 'Percentual da multa rescisória da CONTRATADA (0-50)';
COMMENT ON COLUMN contratos_legais.multa_rescisao_exa_ativa IS 'Se a multa rescisória da CONTRATADA (EXA) está ativa neste contrato';
COMMENT ON COLUMN contratos_legais.multa_rescisao_exa_percentual IS 'Percentual da multa rescisória da CONTRATADA (0-50)';