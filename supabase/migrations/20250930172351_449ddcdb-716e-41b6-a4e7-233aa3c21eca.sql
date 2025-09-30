-- ============================================
-- FINANCIAL DATA SECURITY FIX FOR PEDIDOS TABLE
-- ============================================

-- 1. Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_secure_pedido_data(uuid);

-- 2. Create secure access function for pedidos with audit logging
CREATE OR REPLACE FUNCTION public.get_secure_pedido_data(p_pedido_id uuid)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  status text,
  valor_total numeric,
  plano_meses integer,
  data_inicio date,
  data_fim date,
  created_at timestamp with time zone,
  lista_predios text[],
  cupom_id uuid,
  log_pagamento jsonb,
  transaction_id text,
  mercadopago_transaction_id text,
  compliance_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_pedido_client_id uuid;
  v_can_access boolean := false;
BEGIN
  v_user_id := auth.uid();
  
  -- Log access attempt
  INSERT INTO public.financial_data_audit_logs (
    user_id,
    table_name,
    operation,
    record_id,
    sensitive_fields,
    risk_level,
    access_granted
  ) VALUES (
    v_user_id,
    'pedidos',
    'SELECT',
    p_pedido_id,
    ARRAY['valor_total', 'log_pagamento', 'transaction_id', 'mercadopago_transaction_id', 'compliance_data'],
    CASE WHEN v_user_id IS NULL THEN 'critical' ELSE 'medium' END,
    false
  );
  
  IF v_user_id IS NULL THEN
    INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
    VALUES ('PEDIDO_ACCESS_DENIED', format('Unauthenticated access attempt to pedido %s', p_pedido_id));
    RETURN;
  END IF;
  
  SELECT role INTO v_user_role FROM public.users WHERE id = v_user_id;
  SELECT p.client_id INTO v_pedido_client_id FROM public.pedidos p WHERE p.id = p_pedido_id;
  
  IF v_pedido_client_id IS NULL THEN
    INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
    VALUES ('PEDIDO_NOT_FOUND', format('User %s attempted to access non-existent pedido %s', v_user_id, p_pedido_id));
    RETURN;
  END IF;
  
  v_can_access := (v_user_role IN ('admin', 'super_admin') OR v_user_id = v_pedido_client_id);
  
  IF NOT v_can_access THEN
    INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
    VALUES ('PEDIDO_ACCESS_DENIED', format('User %s (role: %s) denied access to pedido %s', v_user_id, v_user_role, p_pedido_id));
    RETURN;
  END IF;
  
  UPDATE public.financial_data_audit_logs
  SET access_granted = true
  WHERE user_id = v_user_id 
    AND table_name = 'pedidos' 
    AND record_id = p_pedido_id
    AND created_at > now() - interval '1 second';
  
  INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
  VALUES ('PEDIDO_ACCESS_GRANTED', format('User %s (role: %s) accessed pedido %s', v_user_id, v_user_role, p_pedido_id));
  
  RETURN QUERY
  SELECT 
    p.id,
    p.client_id,
    p.status,
    p.valor_total,
    p.plano_meses,
    p.data_inicio,
    p.data_fim,
    p.created_at,
    p.lista_predios,
    p.cupom_id,
    CASE WHEN v_user_role IN ('admin', 'super_admin') THEN p.log_pagamento ELSE NULL END,
    CASE WHEN v_user_role IN ('admin', 'super_admin') THEN p.transaction_id ELSE NULL END,
    CASE WHEN v_user_role IN ('admin', 'super_admin') THEN p.mercadopago_transaction_id ELSE NULL END,
    CASE WHEN v_user_role IN ('admin', 'super_admin') THEN p.compliance_data ELSE NULL END
  FROM public.pedidos p
  WHERE p.id = p_pedido_id;
END;
$$;

-- 3. Create function to detect suspicious financial access patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_financial_access()
RETURNS TABLE (
  user_id uuid,
  access_count bigint,
  failed_attempts bigint,
  risk_score integer,
  last_access timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH recent_access AS (
    SELECT 
      fdal.user_id,
      COUNT(*) as total_attempts,
      COUNT(*) FILTER (WHERE access_granted = false) as failed_count,
      MAX(fdal.created_at) as last_attempt
    FROM public.financial_data_audit_logs fdal
    WHERE fdal.created_at > now() - interval '1 hour'
      AND fdal.table_name = 'pedidos'
    GROUP BY fdal.user_id
  )
  SELECT 
    ra.user_id,
    ra.total_attempts,
    ra.failed_count,
    CASE 
      WHEN ra.failed_count > 10 THEN 100
      WHEN ra.failed_count > 5 THEN 75
      WHEN ra.total_attempts > 50 THEN 60
      WHEN ra.total_attempts > 20 THEN 40
      ELSE 20
    END as risk_score,
    ra.last_attempt
  FROM recent_access ra
  WHERE ra.total_attempts > 10 OR ra.failed_count > 3
  ORDER BY risk_score DESC, ra.total_attempts DESC;
  
  INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
  SELECT 
    'SUSPICIOUS_FINANCIAL_ACCESS_DETECTED',
    format('User %s: %s access attempts, %s failed, risk score: %s', 
           t.user_id, t.access_count, t.failed_attempts, t.risk_score)
  FROM (
    SELECT * FROM recent_access
    WHERE total_attempts > 20 OR failed_count > 5
  ) t;
END;
$$;

-- 4. Create trigger function to log all modifications to pedidos
CREATE OR REPLACE FUNCTION public.log_pedidos_modifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operation text;
  v_sensitive_fields text[];
BEGIN
  v_operation := TG_OP;
  v_sensitive_fields := ARRAY['valor_total', 'log_pagamento', 'transaction_id', 
                               'mercadopago_transaction_id', 'compliance_data'];
  
  INSERT INTO public.financial_data_audit_logs (
    user_id,
    table_name,
    operation,
    record_id,
    sensitive_fields,
    risk_level,
    access_granted
  ) VALUES (
    auth.uid(),
    'pedidos',
    v_operation,
    COALESCE(NEW.id, OLD.id),
    v_sensitive_fields,
    CASE 
      WHEN v_operation = 'DELETE' THEN 'high'
      WHEN v_operation = 'UPDATE' THEN 'medium'
      ELSE 'low'
    END,
    true
  );
  
  INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
  VALUES (
    'PEDIDO_MODIFICATION',
    format('User %s performed %s on pedido %s', auth.uid(), v_operation, COALESCE(NEW.id, OLD.id))
  );
  
  IF v_operation = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 5. Create trigger for pedidos modifications
DROP TRIGGER IF EXISTS log_pedidos_modifications_trigger ON public.pedidos;
CREATE TRIGGER log_pedidos_modifications_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.log_pedidos_modifications();

-- 6. Log the security enhancement
INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
VALUES (
  'FINANCIAL_SECURITY_ENHANCED',
  'Comprehensive financial data protection applied to pedidos table with audit logging and monitoring'
);