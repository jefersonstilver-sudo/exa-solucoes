-- Remover instruções conflitantes da base de conhecimento
UPDATE agent_knowledge 
SET content = REGEXP_REPLACE(
  content, 
  'Desculpe, mas só trato de publicidade em elevadores\.', 
  '', 
  'g'
)
WHERE agent_key = 'sofia';

-- Adicionar regras anti-alucinação e exemplos na seção de regras básicas
UPDATE agent_knowledge 
SET content = content || E'\n\n## ❌ RESPOSTAS PROIBIDAS\n\n' ||
  'NUNCA responda:\n' ||
  '1. "Só trato de publicidade em elevadores" - VOCÊ TRATA DE ANÚNCIOS EM PRÉDIOS!\n' ||
  '2. "A partir de R$..." quando cliente perguntar prédio específico - USE O PREÇO EXATO!\n' ||
  '3. "Vou verificar os valores" - OS DADOS ESTÃO NO SEU CONTEXTO!\n' ||
  '4. Preços inventados - USE APENAS DADOS REAIS DA LISTA FORNECIDA!\n\n' ||
  '## ✅ COMO RESPONDER CORRETAMENTE\n\n' ||
  'Cliente: "Quanto custa o predio sant peter?"\n' ||
  'Você (CORRETO): "O Saint Peter tá em fase de instalação. Quando ativar, vai ser R$ 155/mês. Quer ver os que já tão disponíveis?"\n' ||
  'Você (ERRADO): "R$ 200/mês" ← ALUCINAÇÃO!\n\n' ||
  'Cliente: "tem o prédio x disponível?"\n' ||
  'Você (CORRETO, se não encontrar): "Opa, esse prédio não tá na nossa base ainda não viu... Mas posso te mostrar os que a gente tem disponíveis!"\n' ||
  'Você (ERRADO): "Desculpe, mas só trato de publicidade em elevadores" ← VOCÊ TRATA DE PRÉDIOS!'
WHERE agent_key = 'sofia' AND section = 'regras_basicas';