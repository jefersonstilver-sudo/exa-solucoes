-- Adicionar campos específicos para contratos de síndicos (comodato)
ALTER TABLE contratos_legais ADD COLUMN IF NOT EXISTS sindico_id UUID REFERENCES sindicos_interessados(id);
ALTER TABLE contratos_legais ADD COLUMN IF NOT EXISTS predio_nome TEXT;
ALTER TABLE contratos_legais ADD COLUMN IF NOT EXISTS predio_endereco TEXT;
ALTER TABLE contratos_legais ADD COLUMN IF NOT EXISTS prazo_aviso_rescisao INTEGER DEFAULT 30;
ALTER TABLE contratos_legais ADD COLUMN IF NOT EXISTS numero_telas_instaladas INTEGER;
ALTER TABLE contratos_legais ADD COLUMN IF NOT EXISTS requer_internet BOOLEAN DEFAULT true;
ALTER TABLE contratos_legais ADD COLUMN IF NOT EXISTS posicao_elevador TEXT DEFAULT 'social';

-- Criar índice para buscar contratos por síndico
CREATE INDEX IF NOT EXISTS idx_contratos_legais_sindico_id ON contratos_legais(sindico_id);

-- Adicionar comentários nas colunas
COMMENT ON COLUMN contratos_legais.sindico_id IS 'Referência ao síndico interessado (para contratos de comodato)';
COMMENT ON COLUMN contratos_legais.predio_nome IS 'Nome do prédio/condomínio';
COMMENT ON COLUMN contratos_legais.predio_endereco IS 'Endereço completo do prédio';
COMMENT ON COLUMN contratos_legais.prazo_aviso_rescisao IS 'Prazo em dias para aviso de rescisão (padrão 30)';
COMMENT ON COLUMN contratos_legais.numero_telas_instaladas IS 'Quantidade de telas a serem instaladas';
COMMENT ON COLUMN contratos_legais.requer_internet IS 'Se requer internet do prédio';
COMMENT ON COLUMN contratos_legais.posicao_elevador IS 'Posição do elevador (social, serviço, ambos)';