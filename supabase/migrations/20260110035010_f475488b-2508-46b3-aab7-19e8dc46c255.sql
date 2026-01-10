-- Adicionar novo tipo 'preco_final' ao constraint de tipo_desconto
ALTER TABLE cupons DROP CONSTRAINT IF EXISTS cupons_tipo_desconto_check;

ALTER TABLE cupons ADD CONSTRAINT cupons_tipo_desconto_check 
CHECK (tipo_desconto IN ('percentual', 'valor_fixo', 'preco_final'));

-- Comentário explicativo
COMMENT ON COLUMN cupons.desconto_percentual IS 'Valor do desconto (%) ou desconto fixo (R$) ou preço final (R$), dependendo do tipo_desconto';