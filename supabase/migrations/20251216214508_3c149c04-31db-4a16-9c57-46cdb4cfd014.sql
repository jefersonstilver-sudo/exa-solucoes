-- Adicionar campos faltantes à tabela produtos_exa
ALTER TABLE produtos_exa ADD COLUMN IF NOT EXISTS proporcao text;
ALTER TABLE produtos_exa ADD COLUMN IF NOT EXISTS tipo_exibicao text;

-- Atualizar especificações conforme Manual v3.0
UPDATE produtos_exa 
SET 
  proporcao = '4:3',
  tipo_exibicao = 'Convencional'
WHERE codigo = 'horizontal';

UPDATE produtos_exa 
SET 
  proporcao = '9:16',
  tipo_exibicao = 'Tela Cheia'
WHERE codigo = 'vertical_premium';