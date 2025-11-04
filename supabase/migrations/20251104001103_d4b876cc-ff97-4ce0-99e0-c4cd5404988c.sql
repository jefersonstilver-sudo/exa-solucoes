-- Melhorar função validate_coupon_secure com mensagens de erro específicas e logging detalhado
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
  v_error_message text;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Autenticação necessária para aplicar cupom');
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
    
    RETURN jsonb_build_object('valid', false, 'error', 'Muitas tentativas. Tente novamente mais tarde.');
  END IF;
  
  -- Log validation attempt
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'COUPON_VALIDATION_ATTEMPT',
    format('Tentativa de validação: código=%s, user_id=%s, valor=%s, quantidade_predios=%s', 
           p_codigo, v_user_id, p_valor_pedido, p_quantidade_predios)
  );
  
  -- Find coupon with basic checks
  SELECT * INTO v_coupon
  FROM public.cupons
  WHERE codigo = p_codigo;
  
  -- Detailed validation with specific error messages
  IF v_coupon.id IS NULL THEN
    v_error_message := 'Cupom não encontrado';
  ELSIF NOT v_coupon.ativo THEN
    v_error_message := 'Cupom inativo';
  ELSIF v_coupon.expira_em IS NOT NULL AND v_coupon.expira_em < now() THEN
    v_error_message := 'Cupom expirado';
  ELSIF v_coupon.data_inicio IS NOT NULL AND v_coupon.data_inicio > now() THEN
    v_error_message := 'Cupom ainda não está disponível';
  ELSIF v_coupon.usos_atuais >= v_coupon.max_usos THEN
    v_error_message := 'Cupom atingiu o limite de usos';
  ELSIF v_coupon.valor_minimo_pedido IS NOT NULL AND p_valor_pedido < v_coupon.valor_minimo_pedido THEN
    v_error_message := format('Valor mínimo do pedido: R$ %.2f', v_coupon.valor_minimo_pedido);
  ELSIF v_coupon.min_predios IS NOT NULL AND p_quantidade_predios < v_coupon.min_predios THEN
    v_error_message := format('Mínimo de %s prédios necessário', v_coupon.min_predios);
  ELSIF v_coupon.max_predios IS NOT NULL AND p_quantidade_predios > v_coupon.max_predios THEN
    v_error_message := format('Máximo de %s prédios permitido', v_coupon.max_predios);
  END IF;
  
  -- If any error was found, log and return
  IF v_error_message IS NOT NULL THEN
    INSERT INTO public.log_eventos_sistema (
      tipo_evento,
      descricao
    ) VALUES (
      'INVALID_COUPON_ATTEMPT',
      format('Cupom inválido: código=%s, user_id=%s, erro=%s, valor=%s, qtd_predios=%s', 
             p_codigo, v_user_id, v_error_message, p_valor_pedido, p_quantidade_predios)
    );
    
    RETURN jsonb_build_object('valid', false, 'error', v_error_message);
  END IF;
  
  -- Check per-user usage limit
  IF v_coupon.uso_por_usuario IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage
    FROM public.pedidos
    WHERE client_id = v_user_id
    AND cupom_id = v_coupon.id
    AND status NOT IN ('cancelado', 'cancelado_automaticamente');
    
    IF v_user_usage >= v_coupon.uso_por_usuario THEN
      INSERT INTO public.log_eventos_sistema (
        tipo_evento,
        descricao
      ) VALUES (
        'COUPON_USER_LIMIT_REACHED',
        format('Limite por usuário atingido: código=%s, user_id=%s, usos=%s', 
               p_codigo, v_user_id, v_user_usage)
      );
      
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
    'COUPON_APPLIED_SUCCESS',
    format('✅ Cupom aplicado: código=%s, user_id=%s, desconto=%s%%, valor=%s, qtd_predios=%s', 
           p_codigo, v_user_id, v_coupon.desconto_percentual, p_valor_pedido, p_quantidade_predios)
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