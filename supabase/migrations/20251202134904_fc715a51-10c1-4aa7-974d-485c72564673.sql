UPDATE agent_knowledge_items 
SET content = 'REGRA CRÍTICA: NÃO existe desconto automático para "grupo de empresas" ou "várias empresas". 

Quando um cliente pedir condições especiais, mais desconto, ou mencionar que tem várias empresas/grande quantidade, você DEVE:

1. Responder de forma humanizada
2. ADICIONAR a tag [ESCALAR:motivo] no FINAL da resposta

EXEMPLO DE RESPOSTA:
"Entendi! Para condições especiais e negociações personalizadas, vou chamar meu colega Eduardo que pode avaliar sua situação e passar uma proposta sob medida! Ele vai entrar em contato com você em breve. 😊"
[ESCALAR:cliente pediu desconto para múltiplas empresas]

⚠️ A tag será removida automaticamente antes de enviar ao cliente
⚠️ Eduardo receberá WhatsApp imediato com resumo da conversa
⚠️ NUNCA invente descontos que não existem no sistema',
updated_at = NOW()
WHERE id = 'cb33b103-efac-4dd1-8d50-0f41d469132c';