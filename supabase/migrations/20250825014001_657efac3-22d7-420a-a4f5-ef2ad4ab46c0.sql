-- Create audit table for financial data access
CREATE TABLE public.financial_data_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  sensitive_fields TEXT[] NOT NULL DEFAULT '{}',
  record_id UUID,
  risk_level TEXT NOT NULL DEFAULT 'low',
  ip_address TEXT,
  user_agent TEXT,
  access_granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for audit logs
ALTER TABLE public.financial_data_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only super admins can access audit logs
CREATE POLICY "Super admins can access financial audit logs"
ON public.financial_data_audit_logs
FOR ALL
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

-- Create function to log financial data access
CREATE OR REPLACE FUNCTION public.log_financial_access(
  p_table_name TEXT,
  p_operation TEXT,
  p_sensitive_fields TEXT[],
  p_record_id UUID,
  p_risk_level TEXT DEFAULT 'low'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  -- Get user role if user exists
  IF v_user_id IS NOT NULL THEN
    SELECT role INTO v_user_role
    FROM public.users
    WHERE id = v_user_id;
  END IF;
  
  -- Log the access attempt
  INSERT INTO public.financial_data_audit_logs (
    user_id,
    table_name,
    operation,
    sensitive_fields,
    record_id,
    risk_level,
    access_granted
  ) VALUES (
    v_user_id,
    p_table_name,
    p_operation,
    p_sensitive_fields,
    p_record_id,
    p_risk_level,
    true -- Access is granted if this function is called
  );
  
  -- For high-risk access, also log to system events
  IF p_risk_level = 'high' THEN
    INSERT INTO public.log_eventos_sistema (
      tipo_evento,
      descricao
    ) VALUES (
      'HIGH_RISK_FINANCIAL_ACCESS',
      format('High-risk access to %s by user %s (role: %s) on record %s', 
             p_table_name, v_user_id, COALESCE(v_user_role, 'unknown'), p_record_id)
    );
  END IF;
  
  RETURN true;
END;
$$;

-- Create encryption functions for sensitive financial data
CREATE OR REPLACE FUNCTION public.encrypt_financial_field(p_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key TEXT;
BEGIN
  -- In production, this would use a proper encryption key from secrets
  -- For now, we'll use a simple encoding to demonstrate the concept
  v_key := 'INDEXA_FINANCIAL_KEY_2024';
  
  -- Simple encryption placeholder - in production use proper encryption
  RETURN encode(hmac(p_value, v_key, 'sha256'), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_financial_field(p_encrypted_value TEXT, p_user_role TEXT DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Get user role if not provided
  IF p_user_role IS NULL THEN
    SELECT role INTO v_user_role
    FROM public.users
    WHERE id = auth.uid();
  ELSE
    v_user_role := p_user_role;
  END IF;
  
  -- Only allow decryption for authorized roles
  IF v_user_role NOT IN ('admin', 'super_admin') THEN
    RETURN '[ENCRYPTED]';
  END IF;
  
  -- In production, this would properly decrypt the value
  -- For now, return the encrypted value to indicate access control works
  RETURN p_encrypted_value;
END;
$$;

-- Create secure function to get pedido data with proper access control
CREATE OR REPLACE FUNCTION public.get_secure_pedido_data(p_pedido_id UUID)
RETURNS TABLE(
  id UUID,
  client_id UUID,
  valor_total NUMERIC,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  plano_meses INTEGER,
  data_inicio DATE,
  data_fim DATE,
  lista_paineis TEXT[],
  lista_predios TEXT[],
  transaction_id TEXT,
  email TEXT,
  -- Sensitive fields that may be encrypted/masked
  log_pagamento JSONB,
  mercadopago_transaction_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_can_access BOOLEAN := false;
  v_pedido RECORD;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get user role
  SELECT role INTO v_user_role
  FROM public.users
  WHERE id = v_user_id;
  
  -- Check access permissions
  SELECT * INTO v_pedido
  FROM public.pedidos p
  WHERE p.id = p_pedido_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  
  -- Determine access level
  IF v_user_role IN ('admin', 'super_admin') THEN
    v_can_access := true;
  ELSIF v_pedido.client_id = v_user_id THEN
    v_can_access := true;
  END IF;
  
  IF NOT v_can_access THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Log the access
  PERFORM log_financial_access(
    'pedidos',
    'SELECT',
    ARRAY['valor_total', 'log_pagamento', 'transaction_id', 'mercadopago_transaction_id'],
    p_pedido_id,
    CASE 
      WHEN v_user_id = v_pedido.client_id THEN 'low'
      WHEN v_user_role IN ('admin', 'super_admin') THEN 'medium'
      ELSE 'high'
    END
  );
  
  -- Return data with appropriate masking based on role
  RETURN QUERY
  SELECT 
    v_pedido.id,
    v_pedido.client_id,
    v_pedido.valor_total,
    v_pedido.status,
    v_pedido.created_at,
    v_pedido.plano_meses,
    v_pedido.data_inicio,
    v_pedido.data_fim,
    v_pedido.lista_paineis,
    v_pedido.lista_predios,
    -- Mask sensitive fields for non-admin users
    CASE 
      WHEN v_user_role IN ('admin', 'super_admin') OR v_user_id = v_pedido.client_id 
      THEN v_pedido.transaction_id
      ELSE '[MASKED]'
    END::TEXT,
    v_pedido.email,
    -- Log payment data only for admins
    CASE 
      WHEN v_user_role IN ('admin', 'super_admin')
      THEN v_pedido.log_pagamento
      ELSE NULL
    END,
    -- Transaction IDs only for admins
    CASE 
      WHEN v_user_role IN ('admin', 'super_admin')
      THEN v_pedido.mercadopago_transaction_id
      ELSE '[MASKED]'
    END::TEXT;
END;
$$;

-- Create function to monitor suspicious financial access patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_financial_access()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_suspicious_users INTEGER;
  v_high_risk_access INTEGER;
  v_failed_access INTEGER;
  v_result JSONB;
BEGIN
  -- Count users with excessive access in last hour
  SELECT COUNT(DISTINCT user_id) INTO v_suspicious_users
  FROM public.financial_data_audit_logs
  WHERE created_at > now() - interval '1 hour'
  GROUP BY user_id
  HAVING COUNT(*) > 20;
  
  -- Count high-risk access attempts
  SELECT COUNT(*) INTO v_high_risk_access
  FROM public.financial_data_audit_logs
  WHERE created_at > now() - interval '24 hours'
  AND risk_level = 'high';
  
  -- Count failed access attempts (placeholder for future implementation)
  v_failed_access := 0;
  
  v_result := jsonb_build_object(
    'suspicious_users', COALESCE(v_suspicious_users, 0),
    'high_risk_access_24h', COALESCE(v_high_risk_access, 0),
    'failed_access_24h', v_failed_access,
    'security_status', CASE 
      WHEN COALESCE(v_suspicious_users, 0) > 5 OR COALESCE(v_high_risk_access, 0) > 50 THEN 'CRITICAL'
      WHEN COALESCE(v_suspicious_users, 0) > 2 OR COALESCE(v_high_risk_access, 0) > 20 THEN 'WARNING'
      ELSE 'NORMAL'
    END,
    'timestamp', now()
  );
  
  -- Log security assessment
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'FINANCIAL_SECURITY_ASSESSMENT',
    format('Financial security assessment: %s', v_result::text)
  );
  
  RETURN v_result;
END;
$$;