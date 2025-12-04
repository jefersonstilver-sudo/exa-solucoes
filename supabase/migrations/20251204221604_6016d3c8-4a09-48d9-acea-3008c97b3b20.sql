-- Adicionar colunas primeiro_nome/sobrenome na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS primeiro_nome TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sobrenome TEXT;

-- Migrar dados existentes para users usando coluna correta (nome)
UPDATE users 
SET 
  primeiro_nome = split_part(nome, ' ', 1),
  sobrenome = CASE 
    WHEN nome LIKE '% %' THEN substring(nome from position(' ' in nome) + 1)
    ELSE ''
  END
WHERE primeiro_nome IS NULL AND nome IS NOT NULL;