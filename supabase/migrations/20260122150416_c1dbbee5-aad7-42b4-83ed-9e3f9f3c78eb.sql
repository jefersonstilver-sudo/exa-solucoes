-- Adicionar campos de proposta avançada à tabela de contratos legais
-- Isso garante que as condições da proposta sejam persistidas no contrato

ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS quantidade_posicoes INTEGER DEFAULT 1;

ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS venda_futura BOOLEAN DEFAULT FALSE;

ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS predios_contratados INTEGER;

ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS predios_instalados_fechamento INTEGER;

ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS cortesia_inicio DATE;

ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS cortesia_fim DATE;

ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS meses_cortesia INTEGER;

ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS titulo_proposta TEXT;

-- Comentários para documentação
COMMENT ON COLUMN contratos_legais.quantidade_posicoes IS 'Número de posições/marcas contratadas (multiplica valor e exibições)';
COMMENT ON COLUMN contratos_legais.venda_futura IS 'Indica se é uma venda futura com período de cortesia';
COMMENT ON COLUMN contratos_legais.predios_contratados IS 'Meta de prédios contratados (para venda futura)';
COMMENT ON COLUMN contratos_legais.predios_instalados_fechamento IS 'Prédios instalados no momento do fechamento';
COMMENT ON COLUMN contratos_legais.cortesia_inicio IS 'Data de início do período de cortesia';
COMMENT ON COLUMN contratos_legais.cortesia_fim IS 'Data de fim do período de cortesia';
COMMENT ON COLUMN contratos_legais.meses_cortesia IS 'Duração estimada do período de cortesia em meses';
COMMENT ON COLUMN contratos_legais.titulo_proposta IS 'Título personalizado da proposta';