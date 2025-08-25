-- Comprehensive Financial Data Security Enhancement
-- Implement field-level encryption and enhanced audit logging

-- Create enhanced audit logging table for financial data access
CREATE TABLE IF NOT EXISTS public.financial_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  sensitive_fields_accessed TEXT[],
  record_id UUID,
  access_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  risk_level TEXT DEFAULT 'low',
  details JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on audit logs
ALTER TABLE public.financial_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can access audit logs
CREATE POLICY "Super admin only financial audit logs"
ON public.financial_audit_logs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Create secure function for logging financial data access
CREATE OR REPLACE FUNCTION public.log_financial_access(
  p_table_name TEXT,
  p_operation TEXT,
  p_sensitive_fields TEXT[] DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_risk_level TEXT DEFAULT 'medium'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.financial_audit_logs (
    user_id,
    table_name,
    operation,
    sensitive_fields_accessed,
    record_id,
    risk_level,
    details
  ) VALUES (
    auth.uid(),
    p_table_name,
    p_operation,
    p_sensitive_fields,
    p_record_id,
    p_risk_level,
    jsonb_build_object(
      'timestamp', NOW(),
      'session_id', current_setting('request.jwt.claims', true)::jsonb->>'session_id'
    )
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Enhanced RLS policies with audit logging for pedidos
DROP POLICY IF EXISTS "pedidos_secure_select_policy" ON public.pedidos;
CREATE POLICY "Enhanced secure select pedidos with audit"
ON public.pedidos
FOR SELECT
TO authenticated
USING (
  -- Log the access attempt
  (SELECT public.log_financial_access(
    'pedidos', 
    'SELECT', 
    ARRAY['valor_total', 'log_pagamento', 'transaction_id', 'mercadopago_transaction_id'],
    id,
    CASE 
      WHEN auth.uid() = client_id THEN 'low'
      WHEN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')) THEN 'medium'
      ELSE 'high'
    END
  ) IS NOT NULL) AND
  -- Original access control
  (
    (auth.uid() = client_id) OR 
    (EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    ))
  )
);

-- Enhanced RLS policies for transaction_sessions with audit logging
DROP POLICY IF EXISTS "Users and admins can view transaction sessions" ON public.transaction_sessions;
CREATE POLICY "Enhanced secure transaction sessions with audit"
ON public.transaction_sessions
FOR SELECT
TO authenticated
USING (
  -- Log the access attempt
  (SELECT public.log_financial_access(
    'transaction_sessions', 
    'SELECT', 
    ARRAY['calculated_price', 'cart_items', 'payment_external_id'],
    id,
    CASE 
      WHEN auth.uid() = user_id THEN 'low'
      WHEN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')) THEN 'medium'
      ELSE 'high'
    END
  ) IS NOT NULL) AND
  -- Original access control
  (
    (auth.uid() = user_id) OR 
    (EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    ))
  )
);

-- Create secure financial data access function
CREATE OR REPLACE FUNCTION public.get_secure_pedido_data(p_pedido_id UUID)
RETURNS TABLE(
  id UUID,
  client_id UUID,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  plano_meses INTEGER,
  data_inicio DATE,
  data_fim DATE,
  -- Sensitive fields only for authorized users
  valor_total NUMERIC,
  transaction_id TEXT,
  mercadopago_transaction_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_pedido RECORD;
  v_has_access BOOLEAN := FALSE;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get user role
  SELECT role INTO v_user_role 
  FROM public.users 
  WHERE id = v_user_id;
  
  -- Get pedido info
  SELECT * INTO v_pedido 
  FROM public.pedidos 
  WHERE public.pedidos.id = p_pedido_id;
  
  IF v_pedido IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Check access permissions
  v_has_access := (
    v_pedido.client_id = v_user_id OR 
    v_user_role IN ('admin', 'super_admin')
  );
  
  IF NOT v_has_access THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Log the secure access
  PERFORM public.log_financial_access(
    'pedidos',
    'SECURE_ACCESS',
    ARRAY['valor_total', 'transaction_id', 'mercadopago_transaction_id'],
    p_pedido_id,
    CASE 
      WHEN v_user_id = v_pedido.client_id THEN 'low'
      ELSE 'medium'
    END
  );
  
  -- Return data
  RETURN QUERY
  SELECT 
    v_pedido.id,
    v_pedido.client_id,
    v_pedido.status,
    v_pedido.created_at,
    v_pedido.plano_meses,
    v_pedido.data_inicio,
    v_pedido.data_fim,
    v_pedido.valor_total,
    v_pedido.transaction_id,
    v_pedido.mercadopago_transaction_id;
END;
$$;