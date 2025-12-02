-- Deletar a seção 4 espúria da tabela agent_sections para o agente Sofia
-- A seção 4 deve ser representada pelos 14 knowledge items, não por texto
DELETE FROM agent_sections 
WHERE agent_id = 'sofia' 
AND section_number = 4;