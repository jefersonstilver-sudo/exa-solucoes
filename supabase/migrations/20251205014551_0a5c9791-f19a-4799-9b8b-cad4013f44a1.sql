-- Atualizar signatários EXA com data de nascimento
UPDATE signatarios_exa 
SET data_nascimento = '1985-03-15'::DATE 
WHERE email = 'natalia@examidia.com.br';

UPDATE signatarios_exa 
SET data_nascimento = '1988-07-22'::DATE 
WHERE email = 'jeferson@examidia.com.br';

-- Limpar duplicata (manter apenas os com email @examidia.com.br)
DELETE FROM signatarios_exa WHERE email = 'atlascamargo829@gmail.com';