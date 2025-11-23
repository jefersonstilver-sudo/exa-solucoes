-- Migrar conteúdo das agent_sections de "sofia" para o UUID correto
-- Section 1: Identidade & Papel do Agente
UPDATE agent_sections 
SET content = (
  SELECT content 
  FROM agent_sections 
  WHERE agent_id = 'sofia' AND section_number = 1
),
updated_at = NOW()
WHERE agent_id = '6e0278e4-c95d-4d90-b976-d19c375b644b' AND section_number = 1;

-- Section 2: Contexto Operacional
UPDATE agent_sections 
SET content = (
  SELECT content 
  FROM agent_sections 
  WHERE agent_id = 'sofia' AND section_number = 2
),
section_title = 'Contexto Operacional & Capacidades',
updated_at = NOW()
WHERE agent_id = '6e0278e4-c95d-4d90-b976-d19c375b644b' AND section_number = 2;

-- Section 3: Limites e Segurança
UPDATE agent_sections 
SET content = (
  SELECT content 
  FROM agent_sections 
  WHERE agent_id = 'sofia' AND section_number = 3
),
section_title = 'Limites & Segurança',
updated_at = NOW()
WHERE agent_id = '6e0278e4-c95d-4d90-b976-d19c375b644b' AND section_number = 3;

-- Deletar as sections antigas com agent_id incorreto
DELETE FROM agent_sections 
WHERE agent_id = 'sofia';