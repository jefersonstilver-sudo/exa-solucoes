
-- Criar tabela para tracking de status de pagamento
CREATE TABLE IF NOT EXISTS public.payment_status_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  status_anterior TEXT NOT NULL,
  status_novo TEXT NOT NULL,
  origem TEXT NOT NULL, -- 'webhook', 'manual', 'system'
  detalhes JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar RLS na tabela de tracking
ALTER TABLE public.payment_status_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all payment tracking" ON public.payment_status_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Função para cancelar pedidos expirados automaticamente
CREATE OR REPLACE FUNCTION public.cancel_expired_orders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cancelled_count integer := 0;
  v_expired_order RECORD;
  v_result jsonb;
BEGIN
  -- Buscar pedidos pendentes há mais de 24 horas
  FOR v_expired_order IN 
    SELECT * FROM public.pedidos 
    WHERE status IN ('pendente', 'pago_pendente_video')
    AND created_at < NOW() - INTERVAL '24 hours'
  LOOP
    -- Cancelar o pedido
    UPDATE public.pedidos 
    SET 
      status = 'cancelado_automaticamente',
      log_pagamento = COALESCE(log_pagamento, '{}'::jsonb) || jsonb_build_object(
        'cancelled_at', now(),
        'cancellation_reason', 'Expirado após 24 horas',
        'auto_cancelled', true
      )
    WHERE id = v_expired_order.id;
    
    -- Registrar o tracking
    INSERT INTO public.payment_status_tracking (
      pedido_id, status_anterior, status_novo, origem, detalhes
    ) VALUES (
      v_expired_order.id, 
      v_expired_order.status, 
      'cancelado_automaticamente',
      'system',
      jsonb_build_object(
        'reason', 'Auto-cancelled after 24 hours',
        'original_created_at', v_expired_order.created_at
      )
    );
    
    v_cancelled_count := v_cancelled_count + 1;
  END LOOP;
  
  -- Limpar tentativas órfãs relacionadas
  DELETE FROM public.tentativas_compra 
  WHERE created_at < NOW() - INTERVAL '48 hours';
  
  -- Limpar sessões de transação órfãs
  DELETE FROM public.transaction_sessions 
  WHERE created_at < NOW() - INTERVAL '48 hours'
  AND status NOT IN ('completed', 'paid');
  
  v_result := jsonb_build_object(
    'success', true,
    'cancelled_orders', v_cancelled_count,
    'cleanup_timestamp', now(),
    'message', format('Cancelled %s expired orders and cleaned up orphaned data', v_cancelled_count)
  );
  
  -- Log do sistema
  INSERT INTO public.log_eventos_sistema (
    tipo_evento, descricao
  ) VALUES (
    'AUTO_ORDER_CANCELLATION',
    format('Sistema cancelou automaticamente %s pedidos expirados', v_cancelled_count)
  );
  
  RETURN v_result;
END;
$$;

-- Função para validar se usuário pode acessar pedido
CREATE OR REPLACE FUNCTION public.can_access_order(p_pedido_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pedido RECORD;
  v_user_id UUID;
BEGIN
  -- Obter ID do usuário atual
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Buscar pedido
  SELECT * INTO v_pedido 
  FROM public.pedidos 
  WHERE id = p_pedido_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Verificar se é o dono do pedido
  IF v_pedido.client_id != v_user_id THEN
    -- Verificar se é admin
    IF NOT EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = v_user_id 
      AND role IN ('admin', 'super_admin')
    ) THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Verificar status do pedido
  IF v_pedido.status IN ('cancelado_automaticamente', 'cancelado') THEN
    RETURN false;
  END IF;
  
  -- Para pedidos pendentes, verificar se não expirou
  IF v_pedido.status = 'pendente' AND v_pedido.created_at < NOW() - INTERVAL '24 hours' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Adicionar RLS mais rigoroso na tabela pedidos
DROP POLICY IF EXISTS "Users can view their own orders" ON public.pedidos;
CREATE POLICY "Users can view accessible orders only" ON public.pedidos
  FOR SELECT USING (
    can_access_order(id)
  );

-- Adicionar RLS na tabela de vídeos do pedido
ALTER TABLE public.pedido_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access videos of accessible orders only" ON public.pedido_videos
  FOR ALL USING (
    can_access_order(pedido_id)
  );

-- Função para processar webhook do MercadoPago corretamente
CREATE OR REPLACE FUNCTION public.process_mercadopago_webhook(webhook_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment_id text;
  v_status text;
  v_external_reference text;
  v_amount numeric;
  v_pedido RECORD;
  v_result jsonb;
BEGIN
  -- Extrair dados do webhook
  v_payment_id := webhook_data->>'id';
  v_status := COALESCE(webhook_data->>'status', webhook_data->'data'->>'status');
  v_external_reference := COALESCE(webhook_data->>'external_reference', webhook_data->'data'->>'external_reference');
  v_amount := COALESCE((webhook_data->>'transaction_amount')::numeric, (webhook_data->'data'->>'transaction_amount')::numeric);
  
  -- Log do webhook recebido
  INSERT INTO public.webhook_logs (origem, payload, status) 
  VALUES ('mercadopago_webhook_processed', webhook_data, 'processing');
  
  -- Se status é aprovado
  IF v_status = 'approved' THEN
    -- Buscar pedido por external_reference ou valor
    SELECT * INTO v_pedido
    FROM public.pedidos 
    WHERE (transaction_id = v_external_reference OR valor_total = v_amount)
    AND status IN ('pendente', 'pago_pendente_video')
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF FOUND THEN
      -- Atualizar status do pedido
      UPDATE public.pedidos 
      SET 
        status = 'pago_pendente_video',
        log_pagamento = COALESCE(log_pagamento, '{}'::jsonb) || jsonb_build_object(
          'payment_confirmed_at', now(),
          'mercadopago_payment_id', v_payment_id,
          'webhook_processed', true,
          'payment_method', 'pix'
        )
      WHERE id = v_pedido.id;
      
      -- Registrar tracking
      INSERT INTO public.payment_status_tracking (
        pedido_id, status_anterior, status_novo, origem, detalhes
      ) VALUES (
        v_pedido.id, 
        v_pedido.status, 
        'pago_pendente_video',
        'webhook',
        jsonb_build_object(
          'payment_id', v_payment_id,
          'amount', v_amount
        )
      );
      
      v_result := jsonb_build_object(
        'success', true,
        'pedido_id', v_pedido.id,
        'message', 'Payment confirmed successfully'
      );
    ELSE
      v_result := jsonb_build_object(
        'success', false,
        'error', 'Order not found',
        'payment_id', v_payment_id
      );
    END IF;
  ELSE
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Webhook received but not processed (status not approved)',
      'status', v_status
    );
  END IF;
  
  RETURN v_result;
END;
$$;
