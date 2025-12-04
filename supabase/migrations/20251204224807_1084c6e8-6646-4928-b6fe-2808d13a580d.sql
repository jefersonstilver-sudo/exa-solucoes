-- Tabela proposals - adicionar colunas de nome separado
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_first_name TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_last_name TEXT;

-- Migrar dados existentes em proposals
UPDATE proposals 
SET 
  client_first_name = split_part(client_name, ' ', 1),
  client_last_name = CASE 
    WHEN client_name LIKE '% %' THEN substring(client_name from position(' ' in client_name) + 1)
    ELSE ''
  END
WHERE client_first_name IS NULL AND client_name IS NOT NULL;

-- Tabela pedidos - adicionar colunas de nome separado
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS client_first_name TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS client_last_name TEXT;

-- Migrar dados existentes em pedidos
UPDATE pedidos 
SET 
  client_first_name = split_part(client_name, ' ', 1),
  client_last_name = CASE 
    WHEN client_name LIKE '% %' THEN substring(client_name from position(' ' in client_name) + 1)
    ELSE ''
  END
WHERE client_first_name IS NULL AND client_name IS NOT NULL;

-- Tabela contratos_legais - adicionar coluna de sobrenome
ALTER TABLE contratos_legais ADD COLUMN IF NOT EXISTS cliente_sobrenome TEXT;

-- Migrar dados existentes em contratos_legais
UPDATE contratos_legais 
SET 
  cliente_sobrenome = CASE 
    WHEN cliente_nome LIKE '% %' THEN substring(cliente_nome from position(' ' in cliente_nome) + 1)
    ELSE ''
  END
WHERE cliente_sobrenome IS NULL AND cliente_nome LIKE '% %';

-- Tabela sindicos_interessados - adicionar colunas (usa nome_completo)
ALTER TABLE sindicos_interessados ADD COLUMN IF NOT EXISTS primeiro_nome TEXT;
ALTER TABLE sindicos_interessados ADD COLUMN IF NOT EXISTS sobrenome TEXT;

-- Migrar dados existentes em sindicos_interessados (nome_completo)
UPDATE sindicos_interessados 
SET 
  primeiro_nome = split_part(nome_completo, ' ', 1),
  sobrenome = CASE 
    WHEN nome_completo LIKE '% %' THEN substring(nome_completo from position(' ' in nome_completo) + 1)
    ELSE ''
  END
WHERE primeiro_nome IS NULL AND nome_completo IS NOT NULL;

-- Tabela signatarios_exa - adicionar colunas
ALTER TABLE signatarios_exa ADD COLUMN IF NOT EXISTS primeiro_nome TEXT;
ALTER TABLE signatarios_exa ADD COLUMN IF NOT EXISTS sobrenome TEXT;

-- Migrar dados existentes em signatarios_exa
UPDATE signatarios_exa 
SET 
  primeiro_nome = split_part(nome, ' ', 1),
  sobrenome = CASE 
    WHEN nome LIKE '% %' THEN substring(nome from position(' ' in nome) + 1)
    ELSE ''
  END
WHERE primeiro_nome IS NULL AND nome IS NOT NULL;