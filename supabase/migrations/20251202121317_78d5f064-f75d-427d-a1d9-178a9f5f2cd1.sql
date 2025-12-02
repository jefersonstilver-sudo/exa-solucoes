INSERT INTO agent_knowledge_items (agent_id, title, content, content_type, keywords, active, display_order)
VALUES (
  'sofia',
  'Desconto Grupo de Empresas - ESCALAÇÃO',
  'REGRA CRÍTICA: NÃO existe desconto automático para "grupo de empresas" ou "várias empresas". Quando um cliente pedir condições especiais, mais desconto, ou mencionar que tem várias empresas/grande quantidade, você DEVE responder: "Entendi! Para condições especiais e negociações personalizadas, vou chamar meu colega Eduardo que pode avaliar sua situação e passar uma proposta sob medida! Ele vai entrar em contato com você em breve." O sistema automaticamente notificará Eduardo com um resumo da conversa. NUNCA invente descontos que não existem no sistema.',
  'text',
  ARRAY['desconto', 'grupo', 'empresas', 'especial', 'negociação', 'eduardo', 'escalação'],
  true,
  99
);