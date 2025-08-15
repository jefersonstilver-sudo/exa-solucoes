-- Adicionar coluna mercadopago_transaction_id na tabela pedidos
ALTER TABLE public.pedidos 
ADD COLUMN mercadopago_transaction_id TEXT;

-- Criar índice para melhor performance na busca
CREATE INDEX idx_pedidos_mercadopago_transaction_id ON public.pedidos (mercadopago_transaction_id);

-- Log da adição da coluna
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'COLUMN_ADDED',
  'Coluna mercadopago_transaction_id adicionada na tabela pedidos para identificação única do MercadoPago'
);