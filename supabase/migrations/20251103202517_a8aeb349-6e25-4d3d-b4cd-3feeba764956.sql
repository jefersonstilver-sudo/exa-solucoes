-- Adicionar campos de quantidade de prédios na tabela cupons
ALTER TABLE public.cupons 
ADD COLUMN IF NOT EXISTS min_predios integer,
ADD COLUMN IF NOT EXISTS max_predios integer;

-- Adicionar campo na tabela de aplicações para rastrear quantidade
ALTER TABLE public.cupom_aplicacoes
ADD COLUMN IF NOT EXISTS quantidade_predios integer;

-- Atualizar função validate_coupon_secure para validar quantidade de prédios
CREATE OR REPLACE FUNCTION public.validate_coupon_secure(
  p_codigo text, 
  p_valor_pedido numeric DEFAULT 0,
  p_quantidade_predios integer DEFAULT 0
)
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
    format('Coupon validation attempt for code: %s, user_id: %s, quantidade_predios: %s', p_codigo, v_user_id, p_quantidade_predios)
  );
  
  -- Validate coupon with building quantity check
  SELECT * INTO v_coupon
  FROM public.cupons
  WHERE codigo = p_codigo
  AND ativo = true
  AND (expira_em IS NULL OR expira_em > now())
  AND (data_inicio IS NULL OR data_inicio <= now())
  AND usos_atuais < max_usos
  AND (valor_minimo_pedido IS NULL OR p_valor_pedido >= valor_minimo_pedido)
  AND (min_predios IS NULL OR p_quantidade_predios >= min_predios)
  AND (max_predios IS NULL OR p_quantidade_predios <= max_predios);
  
  IF v_coupon.id IS NULL THEN
    -- Log invalid coupon attempt
    INSERT INTO public.log_eventos_sistema (
      tipo_evento,
      descricao
    ) VALUES (
      'INVALID_COUPON_ATTEMPT',
      format('Invalid coupon attempt for code: %s, user_id: %s, quantidade_predios: %s', p_codigo, v_user_id, p_quantidade_predios)
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
  
  -- REGISTRAR APLICAÇÃO DO CUPOM
  INSERT INTO public.cupom_aplicacoes (
    cupom_id,
    user_id,
    valor_pedido_estimado,
    quantidade_predios,
    aplicado_em
  ) VALUES (
    v_coupon.id,
    v_user_id,
    p_valor_pedido,
    p_quantidade_predios,
    now()
  );
  
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
    format('Cupom aplicado: código=%s, user_id=%s, desconto=%s%%, quantidade_predios=%s, usos_atuais incrementado', 
           p_codigo, v_user_id, v_coupon.desconto_percentual, p_quantidade_predios)
  );
  
  v_result := jsonb_build_object(
    'valid', true,
    'id', v_coupon.id,
    'codigo', v_coupon.codigo,
    'desconto_percentual', v_coupon.desconto_percentual,
    'tipo_desconto', v_coupon.tipo_desconto,
    'min_meses', v_coupon.min_meses,
    'valor_minimo_pedido', v_coupon.valor_minimo_pedido,
    'min_predios', v_coupon.min_predios,
    'max_predios', v_coupon.max_predios,
    'descricao', v_coupon.descricao
  );
  
  RETURN v_result;
END;
$function$;