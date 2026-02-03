-- Adicionar coluna para logo do cliente nas propostas
-- Armazena a URL da logo processada por IA (com fundo removido, upscaled)

ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS client_logo_url TEXT DEFAULT NULL;

COMMENT ON COLUMN proposals.client_logo_url IS 
  'URL da logo do cliente processada por IA para exibição na proposta pública e PDF';