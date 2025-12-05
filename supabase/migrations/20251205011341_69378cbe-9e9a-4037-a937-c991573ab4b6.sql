-- Adicionar Natália Krause como segunda signatária EXA
INSERT INTO signatarios_exa (
  nome, 
  email, 
  cpf, 
  cargo, 
  nacionalidade, 
  estado_civil, 
  profissao, 
  cidade, 
  estado, 
  is_active, 
  is_default,
  primeiro_nome, 
  sobrenome
) VALUES (
  'Natália Krause Guimarães Dantas',
  'natalia@examidia.com.br',
  '116.228.359-99',
  'Representante Legal',
  'brasileira',
  'casada',
  'empresária',
  'Foz do Iguaçu',
  'PR',
  true,
  false,
  'Natália',
  'Krause Guimarães Dantas'
) ON CONFLICT DO NOTHING;

-- Adicionar coluna RG se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'signatarios_exa' 
    AND column_name = 'rg'
  ) THEN
    ALTER TABLE signatarios_exa ADD COLUMN rg TEXT;
  END IF;
END $$;

-- Atualizar RGs dos signatários EXA
UPDATE signatarios_exa SET rg = '13.038.569-9' WHERE cpf = '116.228.359-99';
UPDATE signatarios_exa SET rg = '8.812.269-0' WHERE cpf = '055.031.279-00';