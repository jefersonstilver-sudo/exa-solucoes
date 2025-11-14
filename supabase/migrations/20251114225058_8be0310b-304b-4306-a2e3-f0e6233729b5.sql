-- Adicionar coluna data_vinculacao faltante
ALTER TABLE painels ADD COLUMN IF NOT EXISTS data_vinculacao TIMESTAMP WITH TIME ZONE;

-- Adicionar índice para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_painels_status_vinculo ON painels(status_vinculo);
CREATE INDEX IF NOT EXISTS idx_painels_codigo_vinculacao ON painels(codigo_vinculacao);

-- Atualizar data_vinculacao para painéis já conectados
UPDATE painels 
SET data_vinculacao = primeira_conexao_at 
WHERE status_vinculo = 'conectado' AND data_vinculacao IS NULL;