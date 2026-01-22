-- Adicionar campos de exclusividade de segmento na tabela contratos_legais
-- Para sincronização completa com a proposta aceita

ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS exclusividade_segmento BOOLEAN DEFAULT FALSE;

ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS segmento_exclusivo TEXT;

ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS exclusividade_percentual NUMERIC DEFAULT 0;

ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS exclusividade_valor_extra NUMERIC DEFAULT 0;

ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS cliente_escolheu_exclusividade BOOLEAN DEFAULT FALSE;

-- Comentários para documentação
COMMENT ON COLUMN contratos_legais.exclusividade_segmento IS 'Indica se a proposta oferecia exclusividade de segmento';
COMMENT ON COLUMN contratos_legais.segmento_exclusivo IS 'Código do segmento exclusivo (ex: lojas_paraguai, real_estate)';
COMMENT ON COLUMN contratos_legais.exclusividade_percentual IS 'Percentual adicional cobrado pela exclusividade';
COMMENT ON COLUMN contratos_legais.exclusividade_valor_extra IS 'Valor em reais adicionado pela exclusividade';
COMMENT ON COLUMN contratos_legais.cliente_escolheu_exclusividade IS 'Se o cliente optou pela versão com exclusividade ao aceitar a proposta';