-- Remover duplicata da seção "predios" (manter apenas "instrucoes")
DELETE FROM agent_knowledge 
WHERE agent_key = 'sofia' 
AND section = 'predios'
AND title = 'Prédios e Cobertura';

-- Atualizar FAQ com preço real
UPDATE agent_knowledge 
SET content = REPLACE(content, 'A partir de R$150/mês', 'De R$129 a R$254/mês')
WHERE agent_key = 'sofia' 
AND section = 'faq';

-- Remover regra antiga se existir
DELETE FROM agent_knowledge 
WHERE agent_key = 'sofia' 
AND section = 'regras_basicas'
AND title = 'VALIDAÇÃO PRÉ-RESPOSTA';

-- Adicionar nova regra de validação pré-resposta
INSERT INTO agent_knowledge (agent_key, section, title, content, is_active)
VALUES (
  'sofia',
  'regras_basicas',
  'VALIDAÇÃO PRÉ-RESPOSTA',
  E'Antes de responder sobre prédios específicos:\n1. Verifique se o nome está na lista de dados reais fornecida no contexto\n2. Se NÃO encontrar o prédio na lista, responda de forma humanizada: "Opa, esse prédio não tá na nossa base ainda não viu... Mas posso te mostrar os que a gente tem disponíveis!"\n3. Use fuzzy matching: "sant peter" = "Saint Peter", "sao francisco" = "São Francisco"\n4. Confirme o status: se está em instalação, informe ao cliente\n5. Use o preço EXATO da lista, sem arredondamentos ou invenções\n6. NUNCA invente informações sobre prédios que não estão na lista fornecida',
  true
);