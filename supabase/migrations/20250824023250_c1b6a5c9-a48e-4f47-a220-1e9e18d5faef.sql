
-- 1) Garantir pedido único por tentativa (se já houver, outra inserção falha)
CREATE UNIQUE INDEX IF NOT EXISTS pedidos_unique_source_tentativa
ON public.pedidos (source_tentativa_id)
WHERE source_tentativa_id IS NOT NULL;

-- 2) Garantir transaction_id único (evita duplicar por transação)
CREATE UNIQUE INDEX IF NOT EXISTS pedidos_unique_transaction_id
ON public.pedidos (transaction_id)
WHERE transaction_id IS NOT NULL;

-- 3) Índice auxiliar para checagem rápida de pendentes iguais (apoia deduplicação na aplicação)
CREATE INDEX IF NOT EXISTS pedidos_idx_pending_by_user_value_time
ON public.pedidos (client_id, valor_total, created_at)
WHERE status = 'pendente';
