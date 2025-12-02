INSERT INTO agent_knowledge_items (agent_id, title, content, content_type, keywords, active, display_order)
VALUES (
  'sofia',
  'Boleto Fidelidade - Resposta Obrigatória',
  'QUANDO O CLIENTE PERGUNTAR: "tem boleto?", "aceita boleto?", "paga com boleto?", "pagamento no boleto?"

SOFIA DEVE RESPONDER OBRIGATORIAMENTE:
"Temos sim! Para planos a partir de 3 meses, você pode pagar com Boleto Fidelidade — são parcelas mensais com contrato de fidelidade.

Opções de plano com boleto:
• Trimestral (3 meses) — 20% OFF
• Semestral (6 meses) — 30% OFF
• Anual (12 meses) — 37,5% OFF

O plano de 1 mês aceita apenas PIX à vista (com 10% extra de desconto) ou cartão.

Qual duração te interessa mais?"

PROIBIDO DIZER:
- "Não temos boleto"
- "Só aceitamos PIX e cartão"
- "Boleto não está disponível"

O SISTEMA TEM BOLETO para planos de 3+ meses (Boleto Fidelidade).',
  'text',
  ARRAY['boleto', 'pagamento', 'fidelidade', 'parcela', 'parcelar', 'forma de pagamento'],
  true,
  100
);