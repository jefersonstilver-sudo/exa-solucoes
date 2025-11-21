-- Limpar configurações antigas do ManyChat da tabela agent_context (obsoleta)
-- Agora usamos SOMENTE agents.manychat_config como fonte única
DELETE FROM agent_context WHERE key = 'manychat_config';