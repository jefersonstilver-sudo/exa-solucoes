-- Função para obter estatísticas de cupons
CREATE OR REPLACE FUNCTION public.get_coupon_stats()
RETURNS TABLE (
  total_cupons bigint,
  cupons_ativos bigint,
  cupons_expirados bigint,
  total_usos bigint,
  receita_com_desconto numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_cupons,
    COUNT(*) FILTER (WHERE ativo = true AND (expira_em IS NULL OR expira_em > NOW()))::bigint as cupons_ativos,
    COUNT(*) FILTER (WHERE expira_em IS NOT NULL AND expira_em <= NOW())::bigint as cupons_expirados,
    COALESCE(SUM(usos_atuais), 0)::bigint as total_usos,
    COALESCE((
      SELECT SUM(p.valor_total * (c.desconto_percentual / 100.0))
      FROM pedidos p
      INNER JOIN cupons c ON c.id = p.cupom_id
      WHERE p.cupom_id IS NOT NULL
      AND p.status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado', 'video_enviado')
    ), 0)::numeric as receita_com_desconto
  FROM cupons;
END;
$$;

-- Função para obter detalhes de uso de um cupom específico
CREATE OR REPLACE FUNCTION public.get_coupon_usage_details(cupom_id_param uuid)
RETURNS TABLE (
  user_email text,
  pedido_id uuid,
  valor_pedido numeric,
  valor_desconto numeric,
  data_uso timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'admin_marketing')
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can view coupon usage details';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(u.email, 'Email não encontrado') as user_email,
    p.id as pedido_id,
    p.valor_total as valor_pedido,
    (p.valor_total * (c.desconto_percentual / 100.0))::numeric as valor_desconto,
    p.created_at as data_uso
  FROM public.pedidos p
  INNER JOIN public.cupons c ON c.id = p.cupom_id
  LEFT JOIN public.users u ON u.id = p.client_id
  WHERE p.cupom_id = cupom_id_param
  AND p.status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado', 'video_enviado', 'pendente')
  ORDER BY p.created_at DESC;
END;
$$;

-- Garantir que a coluna cupom_id existe na tabela pedidos e tem índice para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_cupom_id ON public.pedidos(cupom_id) WHERE cupom_id IS NOT NULL;