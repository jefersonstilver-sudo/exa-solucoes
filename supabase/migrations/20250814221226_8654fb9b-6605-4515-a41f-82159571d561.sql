-- Função para identificar pedidos com possíveis pagamentos duplicados
CREATE OR REPLACE FUNCTION public.detect_duplicate_payments()
RETURNS TABLE(
  pedido_id UUID,
  client_id UUID,
  valor_total NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  payment_id TEXT,
  external_reference TEXT,
  suspicious_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as pedido_id,
    p.client_id,
    p.valor_total,
    p.status,
    p.created_at,
    (p.log_pagamento->>'mercadopago_payment_id')::TEXT as payment_id,
    (p.log_pagamento->>'external_reference')::TEXT as external_reference,
    CASE 
      WHEN p.valor_total = 0.11 AND p.status IN ('pago', 'pago_pendente_video') 
        AND p.created_at >= '2025-08-14'::date 
        THEN 'test_value_recent_payment'
      WHEN EXISTS (
        SELECT 1 FROM public.pedidos p2 
        WHERE p2.id != p.id 
        AND p2.valor_total = p.valor_total 
        AND p2.status IN ('pago', 'pago_pendente_video')
        AND ABS(EXTRACT(EPOCH FROM (p2.created_at - p.created_at))) < 3600
      ) THEN 'multiple_same_value_same_hour'
      ELSE 'other'
    END as suspicious_reason
  FROM public.pedidos p
  WHERE p.status IN ('pago', 'pago_pendente_video')
  AND (
    -- Pedidos de teste com valor R$0.11 recentes
    (p.valor_total = 0.11 AND p.created_at >= '2025-08-14'::date)
    OR
    -- Pedidos com mesmo valor processados na mesma hora
    EXISTS (
      SELECT 1 FROM public.pedidos p2 
      WHERE p2.id != p.id 
      AND p2.valor_total = p.valor_total 
      AND p2.status IN ('pago', 'pago_pendente_video')
      AND ABS(EXTRACT(EPOCH FROM (p2.created_at - p.created_at))) < 3600
    )
  )
  ORDER BY p.created_at DESC;
END;
$$;

-- Função para reverter pagamentos suspeitos (apenas para super admins)
CREATE OR REPLACE FUNCTION public.revert_suspicious_payment(
  p_pedido_id UUID,
  p_reason TEXT DEFAULT 'duplicate_payment_correction'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pedido RECORD;
  v_user_role TEXT;
  v_result JSONB;
BEGIN
  -- Verificar se usuário é super admin
  SELECT role INTO v_user_role
  FROM public.users
  WHERE id = auth.uid();
  
  IF v_user_role != 'super_admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Apenas super admins podem reverter pagamentos'
    );
  END IF;
  
  -- Buscar o pedido
  SELECT * INTO v_pedido
  FROM public.pedidos
  WHERE id = p_pedido_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pedido não encontrado'
    );
  END IF;
  
  -- Reverter para status pendente
  UPDATE public.pedidos
  SET 
    status = 'pendente',
    log_pagamento = COALESCE(log_pagamento, '{}'::jsonb) || jsonb_build_object(
      'reverted_at', now(),
      'reverted_by', auth.uid(),
      'revert_reason', p_reason,
      'original_status', v_pedido.status
    )
  WHERE id = p_pedido_id;
  
  -- Log da reversão
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'PAYMENT_REVERTED',
    format('Pagamento revertido pelo admin %s: Pedido %s (status: %s -> pendente) - Motivo: %s', 
           auth.uid(), p_pedido_id, v_pedido.status, p_reason)
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'pedido_id', p_pedido_id,
    'previous_status', v_pedido.status,
    'new_status', 'pendente',
    'reason', p_reason
  );
  
  RETURN v_result;
END;
$$;