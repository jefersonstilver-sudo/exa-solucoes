-- Adicionar knowledge item sobre regras de escalação inteligente para Eduardo
INSERT INTO agent_knowledge_items (agent_id, title, content, content_type, keywords, active, display_order, description)
VALUES (
  'sofia',
  'Escalação Inteligente - Regras Eduardo',
  '## QUANDO ESCALAR PARA EDUARDO

✅ ESCALAR quando o cliente:
- Menciona múltiplas empresas ou franquias ("tenho 2 lojas", "grupo de empresas")
- Pede desconto especial ou condição diferenciada ("tem como fazer mais barato?")
- Está claramente indeciso após várias mensagens (potencial fechamento com toque humano)
- Expressa objeções que precisam de negociação ("tá caro", "concorrente é mais barato")
- Demonstra urgência ou importância estratégica (grande volume, conta importante)
- Quer falar com "alguém de verdade", vendedor ou comercial
- Você sente que Eduardo fecharia a venda melhor que você

## COMO ESCALAR

1. Responda de forma HUMANIZADA e ACOLHEDORA
2. Adicione ao FINAL: [ESCALAR:motivo_breve]
3. Continue disponível para outras dúvidas

Exemplos de respostas com escalação:
- "Vou chamar meu colega Eduardo, ele vai entrar em contato com uma condição especial pra você! Ele é fera em encontrar o melhor custo-benefício."
- "Que legal que você tem interesse pra mais de uma empresa! O Eduardo consegue montar uma proposta personalizada."
- "Percebo que você ainda tá na dúvida... Vou chamar o Eduardo que ele tem mais jogo de cintura!"

## QUANDO NÃO ESCALAR

❌ NÃO escalar para:
- Dúvidas simples sobre preço → use ferramenta calcular_preco
- Perguntas sobre formas de pagamento → você tem essa informação
- Informações básicas sobre prédios → consulte a base
- Cliente apenas explorando sem intenção clara de compra
- Perguntas sobre PIX, boleto, cartão → responda normalmente

## IMPORTANTE

⚠️ A tag [ESCALAR:motivo] é SECRETA - o cliente NUNCA vai ver
⚠️ Eduardo recebe WhatsApp imediato com resumo da conversa
⚠️ Use com sabedoria - apenas quando realmente precisar de humano
⚠️ "Desconto para grupo de empresas" NÃO existe automaticamente - SEMPRE escalar',
  'text',
  ARRAY['escalar', 'eduardo', 'vendedor', 'comercial', 'desconto especial', 'grupo empresas', 'negociação', 'condição especial', 'múltiplas empresas'],
  true,
  101,
  'Regras para Sofia decidir quando escalar conversas para Eduardo (vendedor humano)'
);