-- Adicionar colunas para cobrança futura e exigência de contrato na tabela proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS cobranca_futura BOOLEAN DEFAULT false;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS data_inicio_cobranca DATE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS exigir_contrato BOOLEAN DEFAULT true;

-- Adicionar colunas correspondentes na tabela pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cobranca_futura BOOLEAN DEFAULT false;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS data_inicio_cobranca DATE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS exigir_contrato BOOLEAN DEFAULT true;

-- Comentários explicativos
COMMENT ON COLUMN proposals.cobranca_futura IS 'Se true, pedido ativa hoje mas cobrança começa na data especificada';
COMMENT ON COLUMN proposals.data_inicio_cobranca IS 'Data de início da cobrança quando cobranca_futura=true';
COMMENT ON COLUMN proposals.exigir_contrato IS 'Se true, upload de vídeo só é liberado após assinatura do contrato';
COMMENT ON COLUMN pedidos.cobranca_futura IS 'Se true, pedido ativa hoje mas cobrança começa na data especificada';
COMMENT ON COLUMN pedidos.data_inicio_cobranca IS 'Data de início da cobrança quando cobranca_futura=true';
COMMENT ON COLUMN pedidos.exigir_contrato IS 'Se true, upload de vídeo só é liberado após assinatura do contrato';