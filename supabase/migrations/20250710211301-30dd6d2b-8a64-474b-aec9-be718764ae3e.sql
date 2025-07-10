-- Corrigir o pedido problemático: remover datas e alterar status
UPDATE public.pedidos 
SET 
  status = 'pago_pendente_video',
  data_inicio = NULL,
  data_fim = NULL,
  log_pagamento = COALESCE(log_pagamento, '{}'::jsonb) || jsonb_build_object(
    'contract_dates_cleared', true,
    'reason', 'Contract should only start when video is approved',
    'corrected_at', now()
  )
WHERE id = 'e98ad003-69c2-42cd-9c6b-15ddc4d4dd0b';