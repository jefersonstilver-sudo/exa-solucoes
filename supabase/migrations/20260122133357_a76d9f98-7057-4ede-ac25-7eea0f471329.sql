-- Adicionar coluna quantidade_posicoes à tabela proposals
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS quantidade_posicoes INTEGER NOT NULL DEFAULT 1;

-- Comentário explicativo
COMMENT ON COLUMN proposals.quantidade_posicoes IS 
  'Número de posições/marcas que o cliente está comprando por prédio. Máximo: 15 (horizontal) ou 3 (vertical).';