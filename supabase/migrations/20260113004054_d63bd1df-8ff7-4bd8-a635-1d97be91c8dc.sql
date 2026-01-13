-- Corrigir pagamentos divergentes identificados na auditoria

-- 1. Parcela com pagamento confirmado mas status incorreto
UPDATE public.parcelas 
SET status = 'pago', 
    data_pagamento = '2026-01-10',
    updated_at = NOW()
WHERE id = 'b6c957bb-1fe8-4b47-90fa-32e35b88b4b3'
  AND status IN ('pendente', 'aguardando_pagamento');

-- 2. Pedido 6f0cc77f-bc00-4b03-a641-5a1e916033a6 (da parcela acima)
UPDATE public.pedidos
SET status = 'aguardando_contrato',
    transaction_id = 'pay_oivsruq39nf6ucdv',
    log_pagamento = jsonb_build_object(
      'provider', 'asaas',
      'payment_status', 'approved',
      'reconciled_at', NOW()::text,
      'reconciled_by', 'migration_fix_divergent_payments'
    ),
    updated_at = NOW()
WHERE id = '6f0cc77f-bc00-4b03-a641-5a1e916033a6'
  AND status = 'pendente';

-- 3. Pedido 63e396d8-5908-4e55-9eac-b7ffaba11beb com pagamento R$10
UPDATE public.pedidos
SET status = 'aguardando_contrato',
    transaction_id = 'pay_lkhlmo312ngez18s',
    log_pagamento = jsonb_build_object(
      'provider', 'asaas',
      'payment_status', 'approved',
      'reconciled_at', NOW()::text,
      'reconciled_by', 'migration_fix_divergent_payments'
    ),
    updated_at = NOW()
WHERE id = '63e396d8-5908-4e55-9eac-b7ffaba11beb'
  AND status = 'pendente';

-- 4. Pedido 83b0f0e4-09b3-4608-ac77-1c8d100ff517 com pagamento R$10
UPDATE public.pedidos
SET status = 'aguardando_contrato',
    transaction_id = 'pay_enkvcrbv7e89mfom',
    log_pagamento = jsonb_build_object(
      'provider', 'asaas',
      'payment_status', 'approved',
      'reconciled_at', NOW()::text,
      'reconciled_by', 'migration_fix_divergent_payments'
    ),
    updated_at = NOW()
WHERE id = '83b0f0e4-09b3-4608-ac77-1c8d100ff517'
  AND status = 'pendente';

-- 5. Registrar log do evento (usando coluna correta: metadata)
INSERT INTO public.log_eventos_sistema (tipo_evento, descricao, metadata)
VALUES (
  'MIGRATION_FIX_DIVERGENT_PAYMENTS',
  'Correção manual de pagamentos divergentes via migration',
  jsonb_build_object(
    'parcelas_corrigidas', ARRAY['b6c957bb-1fe8-4b47-90fa-32e35b88b4b3'],
    'pedidos_corrigidos', ARRAY[
      '6f0cc77f-bc00-4b03-a641-5a1e916033a6',
      '63e396d8-5908-4e55-9eac-b7ffaba11beb',
      '83b0f0e4-09b3-4608-ac77-1c8d100ff517'
    ],
    'executed_at', NOW()::text
  )
);