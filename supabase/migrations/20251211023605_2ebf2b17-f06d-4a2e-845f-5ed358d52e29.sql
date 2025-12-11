-- Atualizar nome do usuário master para "Jeferson Encina"
UPDATE users 
SET nome = 'Jeferson Encina'
WHERE email = 'jefersonstilver@gmail.com';

-- Também atualizar na tabela profiles se existir
UPDATE profiles
SET full_name = 'Jeferson Encina'
WHERE id = '7cca6d1b-ca4f-4190-a7fe-5148e7dc2308';