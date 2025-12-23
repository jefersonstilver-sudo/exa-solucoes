-- Inserir registro padrão na tabela commercial_alerts_config se estiver vazia
INSERT INTO commercial_alerts_config (
  ativo, 
  horarios_envio, 
  dias_semana,
  alerta_propostas_pendentes,
  alerta_contratos_pendentes,
  alerta_propostas_expirando,
  template_propostas,
  template_contratos
)
SELECT 
  true,
  '["09:00", "12:00", "15:00"]'::jsonb,
  '["seg", "ter", "qua", "qui", "sex"]'::jsonb,
  true,
  true,
  true,
  '🔔 *Lembrete de Proposta*

📊 Você tem propostas aguardando resposta:
{{proposals_list}}

⏰ Propostas pendentes há mais de 24h precisam de acompanhamento.

📋 Acesse o painel para mais detalhes.',
  '📄 *Lembrete de Contrato*

✍️ Contratos aguardando assinatura:
{{contracts_list}}

⏰ Contratos pendentes há mais de 48h precisam de acompanhamento.

📋 Acesse o painel jurídico para mais detalhes.'
WHERE NOT EXISTS (SELECT 1 FROM commercial_alerts_config LIMIT 1);