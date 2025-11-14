-- Adicionar campos necessários na tabela painels para o sistema EXA Kiosk
ALTER TABLE painels 
  ADD COLUMN IF NOT EXISTS numero_painel TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS token_acesso TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS link_instalacao TEXT,
  ADD COLUMN IF NOT EXISTS status_vinculo TEXT DEFAULT 'aguardando_instalacao';

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_painels_numero ON painels(numero_painel);
CREATE INDEX IF NOT EXISTS idx_painels_token ON painels(token_acesso);
CREATE INDEX IF NOT EXISTS idx_painels_status_vinculo ON painels(status_vinculo);

-- Adicionar comentários nas colunas
COMMENT ON COLUMN painels.numero_painel IS 'Número único do painel (ex: 001, 002, 123)';
COMMENT ON COLUMN painels.token_acesso IS 'Token único para acesso e identificação do painel via URL';
COMMENT ON COLUMN painels.link_instalacao IS 'Link completo para instalação do painel PWA';
COMMENT ON COLUMN painels.status_vinculo IS 'Status do vínculo: aguardando_instalacao, aguardando_vinculo, vinculado, offline';