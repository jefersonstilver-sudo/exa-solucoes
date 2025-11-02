-- Remover a expressão de geração da coluna publico_estimado
-- para permitir edição manual do valor

ALTER TABLE buildings 
ALTER COLUMN publico_estimado DROP EXPRESSION;

-- Adicionar comentário explicativo
COMMENT ON COLUMN buildings.publico_estimado IS 'Público estimado - pode ser calculado automaticamente (numero_unidades * 3.5) ou editado manualmente';