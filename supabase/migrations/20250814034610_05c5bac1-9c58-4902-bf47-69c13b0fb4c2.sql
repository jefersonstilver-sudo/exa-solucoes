-- Fix discount code security vulnerabilities
-- Remove overly permissive coupon access and implement secure validation

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.cupons;
DROP POLICY IF EXISTS "Users can validate active coupons" ON public.cupons;
DROP POLICY IF EXISTS "authenticated_view_cupons" ON public.cupons;

-- Create secure coupon validation function with rate limiting
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
  
  -- Log successful validation
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'COUPON_VALIDATION_SUCCESS',
    format('Valid coupon found for code: %s, user_id: %s, discount: %s%%', 
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

-- Create secure coupon application function
CREATE OR REPLACE FUNCTION public.apply_coupon_secure(p_codigo text, p_pedido_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_coupon RECORD;
  v_pedido RECORD;
  v_user_id uuid;
  v_user_usage integer;
  v_result jsonb;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  -- Get pedido and verify ownership
  SELECT * INTO v_pedido
  FROM public.pedidos
  WHERE id = p_pedido_id
  AND client_id = v_user_id;
  
  IF v_pedido.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found or access denied');
  END IF;
  
  -- Validate coupon using secure function
  SELECT * INTO v_result
  FROM public.validate_coupon_secure(p_codigo, v_pedido.valor_total);
  
  IF NOT (v_result->>'valid')::boolean THEN
    RETURN jsonb_build_object('success', false, 'error', v_result->>'error');
  END IF;
  
  -- Get coupon details
  SELECT * INTO v_coupon
  FROM public.cupons
  WHERE id = (v_result->>'id')::uuid;
  
  -- Check per-user usage limit
  IF v_coupon.uso_por_usuario IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage
    FROM public.pedidos
    WHERE client_id = v_user_id
    AND cupom_id = v_coupon.id;
    
    IF v_user_usage >= v_coupon.uso_por_usuario THEN
      RETURN jsonb_build_object('success', false, 'error', 'Coupon usage limit exceeded for this user');
    END IF;
  END IF;
  
  -- Apply coupon to order
  UPDATE public.pedidos
  SET cupom_id = v_coupon.id
  WHERE id = p_pedido_id;
  
  -- Increment usage counter
  UPDATE public.cupons
  SET usos_atuais = usos_atuais + 1
  WHERE id = v_coupon.id;
  
  -- Log successful application
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'COUPON_APPLIED_SUCCESS',
    format('Coupon applied successfully: code=%s, pedido_id=%s, user_id=%s, discount=%s%%', 
           p_codigo, p_pedido_id, v_user_id, v_coupon.desconto_percentual)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'discount_percent', v_coupon.desconto_percentual,
    'coupon_id', v_coupon.id
  );
END;
$function$;

-- Create restrictive RLS policies that only allow admin management and secure validation
CREATE POLICY "Admins can manage all coupons secure" 
ON public.cupons 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Deny direct SELECT access to coupons - users must use validation functions
CREATE POLICY "Deny direct coupon access" 
ON public.cupons 
FOR SELECT 
USING (false);

-- Create audit table for coupon security monitoring
CREATE TABLE IF NOT EXISTS public.coupon_security_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  event_type text NOT NULL,
  coupon_code text,
  ip_address text,
  user_agent text,
  details jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.coupon_security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view coupon security events" 
ON public.coupon_security_events 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Create function to monitor suspicious coupon activity
CREATE OR REPLACE FUNCTION public.monitor_coupon_security()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_suspicious_users integer;
  v_high_value_attempts integer;
  v_result jsonb;
BEGIN
  -- Count users with excessive validation attempts in last hour
  SELECT COUNT(DISTINCT(split_part(split_part(descricao, 'user_id: ', 2), ',', 1))) INTO v_suspicious_users
  FROM public.log_eventos_sistema
  WHERE tipo_evento = 'COUPON_VALIDATION_ATTEMPT'
  AND created_at > now() - interval '1 hour'
  GROUP BY split_part(split_part(descricao, 'user_id: ', 2), ',', 1)
  HAVING COUNT(*) > 5;
  
  -- Count high-value coupon attempts
  SELECT COUNT(*) INTO v_high_value_attempts
  FROM public.log_eventos_sistema
  WHERE tipo_evento = 'COUPON_VALIDATION_ATTEMPT'
  AND created_at > now() - interval '1 hour'
  AND descricao LIKE '%discount: %50%'
  OR descricao LIKE '%discount: %40%'
  OR descricao LIKE '%discount: %30%';
  
  v_result := jsonb_build_object(
    'suspicious_users', COALESCE(v_suspicious_users, 0),
    'high_value_attempts', COALESCE(v_high_value_attempts, 0),
    'status', CASE 
      WHEN COALESCE(v_suspicious_users, 0) > 3 OR COALESCE(v_high_value_attempts, 0) > 10 THEN 'HIGH_RISK'
      WHEN COALESCE(v_suspicious_users, 0) > 1 OR COALESCE(v_high_value_attempts, 0) > 5 THEN 'MEDIUM_RISK'
      ELSE 'LOW_RISK'
    END,
    'timestamp', now()
  );
  
  -- Log security assessment
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'COUPON_SECURITY_ASSESSMENT',
    format('Security assessment completed: %s', v_result::text)
  );
  
  RETURN v_result;
END;
$function$;