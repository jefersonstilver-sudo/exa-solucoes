
-- Habilitar Realtime para a tabela pedidos
ALTER TABLE public.pedidos REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;

-- Criar política RLS para permitir que clientes vejam apenas seus próprios pedidos em tempo real
CREATE POLICY "Users can view their own orders in realtime"
ON public.pedidos
FOR SELECT
USING (
  auth.uid() = client_id
);

-- Habilitar RLS na tabela pedidos se ainda não estiver habilitado
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
