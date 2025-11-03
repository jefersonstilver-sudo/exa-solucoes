-- Modificar validate_coupon_secure para incrementar uso imediatamente ao aplicar
CREATE OR REPLACE FUNCTION public.validate_coupon_secure(p_codigo text, p_valor_pedido numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_coupon RECORD;
  v_user_id uuid;
  v_rate_limit_key text;
  v_attempts integer;
  v_result jsonb;
  v_user_usage integer;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Authentication required');
  END IF;
  
  -- Rate limiting: max 10 attempts per user per hour
  v_rate_limit_key := 'coupon_validation_' || v_user_id::text;
  
  -- Check recent attempts (simplified rate limiting)
  SELECT COUNT(*) INTO v_attempts
  FROM public.log_eventos_sistema
  WHERE tipo_evento = 'COUPON_VALIDATION_ATTEMPT'
  AND descricao LIKE '%user_id: ' || v_user_id::text || '%'
  AND created_at > now() - interval '1 hour';
  
  IF v_attempts >= 10 THEN
    -- Log rate limit exceeded
    INSERT INTO public.log_eventos_sistema (
      tipo_evento,
      descricao
    ) VALUES (
      'COUPON_RATE_LIMIT_EXCEEDED',
      format('Rate limit exceeded for user_id: %s, attempts: %s', v_user_id, v_attempts)
    );
    
    RETURN jsonb_build_object('valid', false, 'error', 'Too many attempts. Please try again later.');
  END IF;
  
  -- Log validation attempt
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'COUPON_VALIDATION_ATTEMPT',
    format('Coupon validation attempt for code: %s, user_id: %s', p_codigo, v_user_id)
  );
  
  -- Validate coupon
  SELECT * INTO v_coupon
  FROM public.cupons
  WHERE codigo = p_codigo
  AND ativo = true
  AND (expira_em IS NULL OR expira_em > now())
  AND (data_inicio IS NULL OR data_inicio <= now())
  AND usos_atuais < max_usos
  AND (valor_minimo_pedido IS NULL OR p_valor_pedido >= valor_minimo_pedido);
  
  IF v_coupon.id IS NULL THEN
    -- Log invalid coupon attempt
    INSERT INTO public.log_eventos_sistema (
      tipo_evento,
      descricao
    ) VALUES (
      'INVALID_COUPON_ATTEMPT',
      format('Invalid coupon attempt for code: %s, user_id: %s', p_codigo, v_user_id)
    );
    
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired coupon code');
  END IF;
  
  -- Check per-user usage limit
  IF v_coupon.uso_por_usuario IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage
    FROM public.pedidos
    WHERE client_id = v_user_id
    AND cupom_id = v_coupon.id
    AND status NOT IN ('cancelado', 'cancelado_automaticamente');
    
    IF v_user_usage >= v_coupon.uso_por_usuario THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Você já atingiu o limite de uso deste cupom');
    END IF;
  END IF;
  
  -- INCREMENTAR O USO DO CUPOM IMEDIATAMENTE QUANDO É APLICADO COM SUCESSO
  UPDATE public.cupons
  SET usos_atuais = usos_atuais + 1
  WHERE id = v_coupon.id;
  
  -- Log successful validation AND increment
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'COUPON_APPLIED_ON_VALIDATION',
    format('Cupom aplicado: código=%s, user_id=%s, desconto=%s%%, usos_atuais incrementado', 
           p_codigo, v_user_id, v_coupon.desconto_percentual)
  );
  
  v_result := jsonb_build_object(
    'valid', true,
    'id', v_coupon.id,
    'codigo', v_coupon.codigo,
    'desconto_percentual', v_coupon.desconto_percentual,
    'tipo_desconto', v_coupon.tipo_desconto,
    'min_meses', v_coupon.min_meses,
    'valor_minimo_pedido', v_coupon.valor_minimo_pedido,
    'descricao', v_coupon.descricao
  );
  
  RETURN v_result;
END;
$function$;

-- Remover trigger de incremento ao criar pedido (agora o cupom já foi incrementado na validação)
DROP TRIGGER IF EXISTS trigger_increment_coupon_on_insert ON public.pedidos;
DROP FUNCTION IF EXISTS public.increment_coupon_usage();

-- MANTER o trigger de decremento quando pedido é cancelado (isso ainda é necessário)
-- Ele já existe e continua funcionando normalmente