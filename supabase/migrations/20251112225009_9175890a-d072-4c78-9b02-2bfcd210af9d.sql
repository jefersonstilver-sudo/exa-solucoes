-- Permitir que usuários vejam cupons aplicados aos seus próprios pedidos
-- Isso é necessário para exibir informações do cupom na página de detalhes do pedido

CREATE POLICY "Users can view coupons from their orders"
ON public.cupons
FOR SELECT
TO authenticated
USING (
  -- Permitir visualização se o cupom foi usado em algum pedido do usuário
  id IN (
    SELECT cupom_id 
    FROM pedidos 
    WHERE client_id = auth.uid() 
    AND cupom_id IS NOT NULL
  )
);

-- Comentário explicativo
COMMENT ON POLICY "Users can view coupons from their orders" ON public.cupons IS 
'Permite que usuários autenticados visualizem apenas os cupons que foram aplicados aos seus próprios pedidos. Necessário para exibir informações do cupom na interface do usuário.';