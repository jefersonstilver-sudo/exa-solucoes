-- Criar tabela para rastrear aplicações de cupom
CREATE TABLE IF NOT EXISTS public.cupom_aplicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cupom_id uuid NOT NULL REFERENCES public.cupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
  valor_pedido_estimado numeric,
  plano_meses integer,
  lista_predios text[],
  aplicado_em timestamp with time zone NOT NULL DEFAULT now(),
  finalizado boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cupom_aplicacoes_cupom_id ON public.cupom_aplicacoes(cupom_id);
CREATE INDEX IF NOT EXISTS idx_cupom_aplicacoes_user_id ON public.cupom_aplicacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_cupom_aplicacoes_pedido_id ON public.cupom_aplicacoes(pedido_id);

-- RLS
ALTER TABLE public.cupom_aplicacoes ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem ver tudo
CREATE POLICY "Admins can view all coupon applications"
ON public.cupom_aplicacoes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'admin_marketing')
  )
);

-- Policy: Usuários podem ver suas próprias aplicações
CREATE POLICY "Users can view their own applications"
ON public.cupom_aplicacoes
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Sistema pode inserir (via função)
CREATE POLICY "System can insert applications"
ON public.cupom_aplicacoes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Atualizar função validate_coupon_secure para registrar aplicação
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
  
  -- REGISTRAR APLICAÇÃO DO CUPOM
  INSERT INTO public.cupom_aplicacoes (
    cupom_id,
    user_id,
    valor_pedido_estimado,
    aplicado_em
  ) VALUES (
    v_coupon.id,
    v_user_id,
    p_valor_pedido,
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

-- Atualizar função get_coupon_usage_details para buscar da nova tabela
DROP FUNCTION IF EXISTS public.get_coupon_usage_details(uuid);

CREATE OR REPLACE FUNCTION public.get_coupon_usage_details(cupom_id_param uuid)
RETURNS TABLE (
  user_email text,
  user_telefone text,
  pedido_id uuid,
  valor_pedido numeric,
  valor_desconto numeric,
  plano_meses integer,
  lista_predios text[],
  data_uso timestamp with time zone,
  status_compra text
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
    ca.pedido_id,
    COALESCE(p.valor_total, ca.valor_pedido_estimado) as valor_pedido,
    COALESCE(
      (p.valor_total * (c.desconto_percentual / 100.0)),
      (ca.valor_pedido_estimado * (c.desconto_percentual / 100.0))
    )::numeric as valor_desconto,
    COALESCE(p.plano_meses, ca.plano_meses) as plano_meses,
    COALESCE(p.lista_predios, ca.lista_predios) as lista_predios,
    ca.aplicado_em as data_uso,
    CASE 
      WHEN ca.pedido_id IS NULL THEN 'Aplicado (compra não finalizada)'
      ELSE COALESCE(p.status, 'pendente')
    END as status_compra
  FROM public.cupom_aplicacoes ca
  INNER JOIN public.cupons c ON c.id = ca.cupom_id
  LEFT JOIN public.users u ON u.id = ca.user_id
  LEFT JOIN public.pedidos p ON p.id = ca.pedido_id
  WHERE ca.cupom_id = cupom_id_param
  ORDER BY ca.aplicado_em DESC;
END;
$$;