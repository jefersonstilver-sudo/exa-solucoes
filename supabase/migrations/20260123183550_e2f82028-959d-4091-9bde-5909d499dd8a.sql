-- ================================================
-- SISTEMA DE TRAVAMENTO DE PREÇO
-- Permite travar o preço por tela para expansões futuras
-- ================================================

-- 1. Adicionar colunas na tabela proposals
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS travamento_preco_ativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS travamento_preco_valor numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS travamento_telas_atuais integer,
ADD COLUMN IF NOT EXISTS travamento_telas_limite integer,
ADD COLUMN IF NOT EXISTS travamento_preco_por_tela numeric;

-- 2. Adicionar colunas na tabela contratos_legais
ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS travamento_preco_ativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS travamento_preco_valor numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS travamento_telas_atuais integer,
ADD COLUMN IF NOT EXISTS travamento_telas_limite integer,
ADD COLUMN IF NOT EXISTS travamento_preco_por_tela numeric;

-- 3. Comentários explicativos
COMMENT ON COLUMN proposals.travamento_preco_ativo IS 'Se o travamento de preço está ativo nesta proposta';
COMMENT ON COLUMN proposals.travamento_preco_valor IS 'Valor cobrado pelo travamento (R$ 0 = gratuito)';
COMMENT ON COLUMN proposals.travamento_telas_atuais IS 'Número de telas instaladas no momento da proposta';
COMMENT ON COLUMN proposals.travamento_telas_limite IS 'Limite de telas até onde o preço está travado';
COMMENT ON COLUMN proposals.travamento_preco_por_tela IS 'Preço por tela que está sendo travado';

COMMENT ON COLUMN contratos_legais.travamento_preco_ativo IS 'Se o travamento de preço está ativo neste contrato';
COMMENT ON COLUMN contratos_legais.travamento_preco_valor IS 'Valor cobrado pelo travamento (R$ 0 = gratuito)';
COMMENT ON COLUMN contratos_legais.travamento_telas_atuais IS 'Número de telas instaladas no fechamento do contrato';
COMMENT ON COLUMN contratos_legais.travamento_telas_limite IS 'Limite de telas até onde o preço está travado';
COMMENT ON COLUMN contratos_legais.travamento_preco_por_tela IS 'Preço por tela travado no contrato';