-- Adicionar campo de título opcional às propostas
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS titulo TEXT;

COMMENT ON COLUMN proposals.titulo IS 'Título opcional da proposta para identificação do cliente (ex: Campanha Black Friday 2026)';