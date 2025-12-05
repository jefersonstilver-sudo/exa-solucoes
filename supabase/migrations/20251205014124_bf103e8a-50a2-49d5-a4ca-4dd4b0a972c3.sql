-- Adicionar colunas RG e Data de Nascimento na tabela signatarios_exa
ALTER TABLE signatarios_exa 
ADD COLUMN IF NOT EXISTS rg TEXT;

ALTER TABLE signatarios_exa 
ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Comentários explicativos
COMMENT ON COLUMN signatarios_exa.rg IS 'Registro Geral do signatário';
COMMENT ON COLUMN signatarios_exa.data_nascimento IS 'Data de nascimento para ClickSign birthday field';