-- Adicionar coluna metodo_pagamento na tabela pedidos
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS metodo_pagamento text;

-- Adicionar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_pedidos_metodo_pagamento 
ON public.pedidos(metodo_pagamento);

-- Atualizar pedidos existentes baseado no log_pagamento
UPDATE public.pedidos
SET metodo_pagamento = CASE
  WHEN log_pagamento->>'tipo' = 'CORTESIA' THEN 'cortesia'
  WHEN log_pagamento->>'payment_type_id' = 'pix' THEN 'pix'
  WHEN log_pagamento->>'payment_type_id' = 'credit_card' THEN 'credit_card'
  WHEN log_pagamento->>'payment_method' = 'pix' THEN 'pix'
  WHEN log_pagamento->>'payment_method' = 'credit_card' THEN 'credit_card'
  ELSE 'pix' -- default
END
WHERE metodo_pagamento IS NULL;