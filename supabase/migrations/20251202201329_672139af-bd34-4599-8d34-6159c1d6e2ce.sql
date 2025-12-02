-- Ativar Eduardo para receber escalações
UPDATE escalacao_vendedores 
SET recebe_escalacoes = true, ativo = true 
WHERE nome ILIKE '%eduardo%';