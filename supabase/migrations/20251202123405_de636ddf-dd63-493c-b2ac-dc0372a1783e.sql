-- Atualizar Seção 2 - substituir 5% por 10% no PIX à Vista
UPDATE agent_sections 
SET content = REPLACE(content, '| **PIX à Vista** | +5% OFF |', '| **PIX à Vista** | +10% OFF |'),
    updated_at = NOW()
WHERE agent_id = 'sofia' AND section_number = 2;

-- Atualizar Seção 3 - substituir 5% por 10% no PIX à Vista
UPDATE agent_sections 
SET content = REPLACE(content, 'desconto PIX à Vista (5%)', 'desconto PIX à Vista (10%)'),
    updated_at = NOW()
WHERE agent_id = 'sofia' AND section_number = 3;