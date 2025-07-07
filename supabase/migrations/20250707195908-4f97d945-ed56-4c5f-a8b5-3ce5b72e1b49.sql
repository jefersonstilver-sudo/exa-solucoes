
-- Correção do preço do prédio Rio Negro
-- Verificar primeiro se existe e depois atualizar
DO $$
BEGIN
  -- Log para verificar se o prédio existe
  IF EXISTS (SELECT 1 FROM buildings WHERE nome = 'Rio Negro') THEN
    RAISE NOTICE 'Prédio Rio Negro encontrado. Atualizando preço...';
    
    -- Atualizar o preço
    UPDATE buildings 
    SET preco_base = 5.00 
    WHERE nome = 'Rio Negro';
    
    -- Verificar se a atualização foi bem-sucedida
    IF FOUND THEN
      RAISE NOTICE 'Preço do Rio Negro atualizado com sucesso para R$ 5.00';
    ELSE
      RAISE NOTICE 'Falha ao atualizar o preço do Rio Negro';
    END IF;
  ELSE
    RAISE NOTICE 'Prédio Rio Negro não encontrado na tabela buildings';
  END IF;
END $$;

-- Query de verificação para confirmar a alteração
SELECT 
  id,
  nome,
  preco_base,
  status
FROM buildings 
WHERE nome = 'Rio Negro';
