-- Correção manual do pagamento não processado pelo webhook

-- 1. Atualizar parcela como paga
UPDATE public.parcelas 
SET 
  status = 'pago',
  data_pagamento = '2026-01-12',
  updated_at = NOW()
WHERE id = '160dc914-cc1e-42de-acb7-dd88d4ed9bf3';

-- 2. Atualizar pedido para aguardando_contrato (conforme fluxo Opção B)
UPDATE public.pedidos 
SET 
  status = 'aguardando_contrato',
  transaction_id = 'pay_rgtdfyjubbc2vyfm',
  log_pagamento = jsonb_build_object(
    'provider', 'asaas',
    'payment_id', 'pay_rgtdfyjubbc2vyfm',
    'payment_status', 'approved',
    'payment_date', '2026-01-12',
    'value', 5.00,
    'manual_fix', true,
    'fixed_at', NOW()::text
  ),
  updated_at = NOW()
WHERE id = '21e9de4f-9152-45f6-ab0b-35cd6b4632a9';

-- 3. Registrar evento de correção manual
INSERT INTO public.log_eventos_sistema (tipo_evento, descricao, metadata)
VALUES (
  'manual_payment_fix',
  'Correção manual de pagamento não processado pelo webhook',
  jsonb_build_object(
    'parcela_id', '160dc914-cc1e-42de-acb7-dd88d4ed9bf3',
    'pedido_id', '21e9de4f-9152-45f6-ab0b-35cd6b4632a9',
    'payment_id', 'pay_rgtdfyjubbc2vyfm',
    'valor', 5.00,
    'motivo', 'Webhook buscava external_reference na tabela pedidos mas era ID de parcela',
    'fix_timestamp', NOW()::text
  )
);