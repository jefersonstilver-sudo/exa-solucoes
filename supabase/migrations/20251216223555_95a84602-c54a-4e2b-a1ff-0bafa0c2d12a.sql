-- Atualizar conhecimento da Sofia: Guia Completo de Compra
UPDATE agent_knowledge_items 
SET content = REPLACE(content, 'até **15 segundos**', 'conforme especificações técnicas do produto contratado')
WHERE title ILIKE '%Guia Completo de Compra%';

-- Atualizar conhecimento da Sofia: Manual do Anunciante - remover "15 segundos"
UPDATE agent_knowledge_items 
SET content = REPLACE(content, 'até 15 segundos', 'conforme especificações do produto (consulte a página de Produtos para valores atualizados)')
WHERE title ILIKE '%Manual%' OR content ILIKE '%15 segundos%';

-- Atualizar conhecimento da Sofia: Remover 1920x1080 hardcoded
UPDATE agent_knowledge_items 
SET content = REPLACE(content, '1920x1080', '(resolução conforme produto - Horizontal: 1440×1080, Vertical: 1080×1920)')
WHERE content ILIKE '%1920x1080%';

-- Atualizar conhecimento da Sofia: Remover "16:9" hardcoded
UPDATE agent_knowledge_items 
SET content = REPLACE(content, '16:9', '(proporção conforme produto - Horizontal: 4:3, Vertical: 9:16)')
WHERE content ILIKE '%16:9%' AND content NOT ILIKE '%vertical%';

-- Adicionar instrução para Sofia sempre consultar especificações dinâmicas
UPDATE agent_knowledge_items 
SET content = content || E'\n\n⚠️ IMPORTANTE: Sempre usar consultar_especificacoes_produtos() para obter valores atualizados de duração, resolução e proporção. Nunca usar valores fixos hardcoded.'
WHERE title IN ('Guia Completo de Compra — Passo a Passo', 'Manual do Anunciante', 'Especificações Técnicas')
AND content NOT ILIKE '%consultar_especificacoes_produtos%';