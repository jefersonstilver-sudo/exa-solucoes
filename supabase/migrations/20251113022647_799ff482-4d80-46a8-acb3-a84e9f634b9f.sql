
-- Atualizar validação para aceitar aprovações manuais de admin
CREATE OR REPLACE FUNCTION validate_pedido_status_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Pegar role do usuário atual
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role') INTO user_role;
  
  -- Se o status está mudando para um status "pago"
  IF NEW.status IN ('pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo')
     AND OLD.status IN ('pendente', 'aguardando_pagamento')
  THEN
    -- Apenas service_role, admin ou super_admin podem fazer essa mudança
    IF user_role NOT IN ('admin', 'super_admin') AND auth.role() != 'service_role' THEN
      RAISE EXCEPTION 'Não autorizado: Apenas edge functions podem marcar pedidos como pagos';
    END IF;
    
    -- Verificar se tem log de pagamento válido (incluindo aprovações manuais)
    IF NEW.log_pagamento IS NULL OR 
       (NEW.log_pagamento::jsonb -> 'pixData' IS NULL AND 
        NEW.log_pagamento::jsonb -> 'pix_data' IS NULL AND
        NEW.log_pagamento::jsonb -> 'payment_preference_id' IS NULL AND
        NEW.log_pagamento::jsonb -> 'manual_payment_id' IS NULL) THEN
      RAISE EXCEPTION 'Não é possível marcar pedido como pago sem dados de pagamento válidos';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Função administrativa para marcar pedido como pago manualmente
CREATE OR REPLACE FUNCTION admin_mark_pedido_as_paid(
  p_pedido_id UUID,
  p_payment_id TEXT,
  p_admin_notes TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
  v_pedido RECORD;
BEGIN
  -- Buscar pedido
  SELECT * INTO v_pedido FROM pedidos WHERE id = p_pedido_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Pedido não encontrado'
    );
  END IF;
  
  -- Atualizar pedido com dados de pagamento manual
  UPDATE pedidos
  SET 
    status = 'pago_pendente_video',
    log_pagamento = COALESCE(log_pagamento, '{}'::jsonb) || jsonb_build_object(
      'manual_approval', true,
      'manual_payment_id', p_payment_id,
      'admin_notes', p_admin_notes,
      'approved_at', NOW(),
      'approved_by', 'admin',
      'payment_status', 'approved'
    ),
    updated_at = NOW()
  WHERE id = p_pedido_id;
  
  -- Registrar no log de eventos
  INSERT INTO log_eventos_sistema (tipo_evento, descricao, ip)
  VALUES (
    'MANUAL_PAYMENT_APPROVAL',
    format('Pedido %s marcado como pago manualmente. Payment ID: %s. Notas: %s', 
           p_pedido_id, p_payment_id, p_admin_notes),
    'admin'
  );
  
  -- Registrar no tracking
  INSERT INTO payment_status_tracking (pedido_id, status_anterior, status_novo, origem, detalhes)
  VALUES (
    p_pedido_id,
    v_pedido.status,
    'pago_pendente_video',
    'manual_admin',
    jsonb_build_object(
      'payment_id', p_payment_id,
      'notes', p_admin_notes,
      'approved_at', NOW()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'pedido_id', p_pedido_id,
    'new_status', 'pago_pendente_video'
  );
END;
$$;

-- Aplicar a correção para o pedido confirmado como pago
SELECT admin_mark_pedido_as_paid(
  '5f4e53d5-87f5-4bd9-a6ff-8d740d60885d'::UUID,
  'MANUAL_PIX_PAYMENT',
  'Pedido confirmado como pago pelo cliente apicemidia. Apenas este pedido foi pago, o outro (03903561) permanece pendente.'
);
