-- Adicionar campos de multa rescisória à tabela contratos_legais
ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS multa_rescisao_ativa boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS multa_rescisao_percentual numeric DEFAULT 20;

-- Comentários para documentação
COMMENT ON COLUMN contratos_legais.multa_rescisao_ativa IS 'Se a multa rescisória está ativa neste contrato';
COMMENT ON COLUMN contratos_legais.multa_rescisao_percentual IS 'Percentual da multa rescisória (0-50)';