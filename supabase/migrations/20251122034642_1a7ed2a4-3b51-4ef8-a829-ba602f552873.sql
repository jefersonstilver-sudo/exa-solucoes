-- Atualizar FAQ para remover instruções conflitantes sobre preços
UPDATE agent_knowledge
SET content = REPLACE(content, 
  E'Quanto custa anunciar?\nDepende do número de prédios. Quer que eu simule pra você?',
  E'Quanto custa anunciar em um prédio específico?\n✅ SEMPRE responda com o preço exato do prédio! Use os dados reais que são injetados automaticamente. NUNCA diga "vou verificar" ou "me chama no telefone".'
)
WHERE agent_key = 'sofia' 
  AND section = 'faq'
  AND content LIKE '%Quanto custa anunciar%';

-- Adicionar seção de erros históricos para aprendizado
UPDATE agent_knowledge
SET content = content || E'\n\n## ⚠️ ERROS QUE VOCÊ JÁ COMETEU (NÃO REPITA!)\n\n' ||
  E'❌ Cliente: "quanto custa saint perer" → Você: "Para valores, me chama no (45) 9 9141-5856"\n' ||
  E'   ✅ CORRETO: "O Saint Peter tá em instalação. Vai ser R$ 155/mês quando ativar!"\n\n' ||
  E'❌ Cliente: pergunta sobre prédio → Você: "Vou verificar pra você"\n' ||
  E'   ✅ CORRETO: Use os dados que já estão injetados no prompt!\n\n' ||
  E'❌ Cliente: pergunta preço → Você: "Qual o seu negócio?"\n' ||
  E'   ✅ CORRETO: Responda o preço PRIMEIRO, depois pergunte sobre o negócio!'
WHERE agent_key = 'sofia' 
  AND section = 'regras_basicas';