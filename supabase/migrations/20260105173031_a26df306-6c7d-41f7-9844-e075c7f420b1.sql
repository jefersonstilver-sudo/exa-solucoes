
-- Atualizar todos os contatos sem categoria definida para 'outros'
UPDATE contacts 
SET categoria = 'outros' 
WHERE categoria IS NULL OR categoria = '';

-- Garantir que o padrão seja 'outros' para novos contatos
ALTER TABLE contacts ALTER COLUMN categoria SET DEFAULT 'outros';
