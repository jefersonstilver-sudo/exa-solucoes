-- Dropar função existente e recriar com novos campos
DROP FUNCTION IF EXISTS public.get_coupon_usage_details(uuid);

-- Recriar função com todos os detalhes necessários
CREATE OR REPLACE FUNCTION public.get_coupon_usage_details(cupom_id_param uuid)
RETURNS TABLE (
  user_email text,
  user_telefone text,
  pedido_id uuid,
  valor_pedido numeric,
  valor_desconto numeric,
  plano_meses integer,
  lista_predios text[],
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
    COALESCE(u.telefone, 'Não informado') as user_telefone,
    p.id as pedido_id,
    p.valor_total as valor_pedido,
    (p.valor_total * (c.desconto_percentual / 100.0))::numeric as valor_desconto,
    p.plano_meses as plano_meses,
    p.lista_predios as lista_predios,
    p.created_at as data_uso
  FROM public.pedidos p
  INNER JOIN public.cupons c ON c.id = p.cupom_id
  LEFT JOIN public.users u ON u.id = p.client_id
  WHERE p.cupom_id = cupom_id_param
  AND p.status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado', 'video_enviado', 'pendente')
  ORDER BY p.created_at DESC;
END;
$$;