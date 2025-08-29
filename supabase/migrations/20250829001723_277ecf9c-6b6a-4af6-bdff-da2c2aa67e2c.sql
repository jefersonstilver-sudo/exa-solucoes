-- Security fix for financial transaction data exposure
-- This migration adds comprehensive security measures for financial data access

-- 1. Create audit logging for financial data access
CREATE OR REPLACE FUNCTION public.audit_financial_access(
  p_table_name text,
  p_operation text,
  p_record_id uuid DEFAULT NULL,
  p_sensitive_fields text[] DEFAULT ARRAY[]::text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_risk_level text := 'low';
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  -- Get user role safely
  SELECT role INTO v_user_role
  FROM public.users
  WHERE id = v_user_id;
  
  -- Determine risk level
  IF p_sensitive_fields && ARRAY['valor_total', 'log_pagamento', 'compliance_data', 'transaction_id'] THEN
    v_risk_level := 'high';
  ELSIF p_sensitive_fields && ARRAY['client_id', 'status', 'created_at'] THEN
    v_risk_level := 'medium';
  END IF;
  
  -- Insert audit log
  INSERT INTO public.financial_data_audit_logs (
    user_id,
    table_name,
    operation,
    record_id,
    sensitive_fields,
    risk_level,
    access_granted,
    ip_address,
    user_agent
  ) VALUES (
    v_user_id,
    p_table_name,
    p_operation,
    p_record_id,
    p_sensitive_fields,
    v_risk_level,
    true, -- Access granted since function was called
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$;

-- 2. Create secure financial data access function
CREATE OR REPLACE FUNCTION public.get_secure_pedido_data(p_pedido_id uuid)
RETURNS TABLE(
  id uuid,
  client_id uuid,
  status text,
  valor_total numeric,
  created_at timestamp with time zone,
  plano_meses integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_pedido_client_id uuid;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get user role
  SELECT role INTO v_user_role
  FROM public.users
  WHERE users.id = v_user_id;
  
  -- Get pedido client_id for ownership check
  SELECT pedidos.client_id INTO v_pedido_client_id
  FROM public.pedidos
  WHERE pedidos.id = p_pedido_id;
  
  -- Security check: only allow access to own pedidos or if admin/super_admin
  IF v_user_role NOT IN ('admin', 'super_admin') AND v_pedido_client_id != v_user_id THEN
    -- Log unauthorized access attempt
    PERFORM public.audit_financial_access(
      'pedidos',
      'unauthorized_access_attempt',
      p_pedido_id,
      ARRAY['valor_total', 'log_pagamento']
    );
    
    RAISE EXCEPTION 'Access denied: insufficient permissions';
  END IF;
  
  -- Log authorized access
  PERFORM public.audit_financial_access(
    'pedidos',
    'select',
    p_pedido_id,
    ARRAY['valor_total', 'client_id', 'status']
  );
  
  -- Return filtered data
  RETURN QUERY
  SELECT 
    p.id,
    p.client_id,
    p.status,
    p.valor_total,
    p.created_at,
    p.plano_meses
  FROM public.pedidos p
  WHERE p.id = p_pedido_id;
END;
$$;

-- 3. Create function to detect suspicious financial access
CREATE OR REPLACE FUNCTION public.detect_suspicious_financial_access()
RETURNS TABLE(
  user_id uuid,
  user_email text,
  access_count bigint,
  high_risk_accesses bigint,
  last_access timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only super admins can run this
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only super admins can detect suspicious access';
  END IF;
  
  RETURN QUERY
  SELECT 
    fdal.user_id,
    COALESCE(au.email, 'Unknown') as user_email,
    COUNT(*) as access_count,
    COUNT(*) FILTER (WHERE fdal.risk_level = 'high') as high_risk_accesses,
    MAX(fdal.created_at) as last_access
  FROM public.financial_data_audit_logs fdal
  LEFT JOIN auth.users au ON au.id = fdal.user_id
  WHERE fdal.created_at > now() - interval '24 hours'
  GROUP BY fdal.user_id, au.email
  HAVING COUNT(*) > 50 OR COUNT(*) FILTER (WHERE fdal.risk_level = 'high') > 10
  ORDER BY access_count DESC;
END;
$$;

-- 4. Secure the existing statistics function
CREATE OR REPLACE FUNCTION public.get_last_12_months_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_result json;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get user role
  SELECT role INTO v_user_role
  FROM public.users
  WHERE users.id = v_user_id;
  
  -- Only admins and super_admins can access financial statistics
  IF v_user_role NOT IN ('admin', 'super_admin') THEN
    -- Log unauthorized access attempt
    PERFORM public.audit_financial_access(
      'pedidos',
      'stats_access_denied',
      NULL,
      ARRAY['valor_total', 'financial_statistics']
    );
    
    RAISE EXCEPTION 'Access denied: Only admins can access financial statistics';
  END IF;
  
  -- Log authorized access
  PERFORM public.audit_financial_access(
    'pedidos',
    'stats_access',
    NULL,
    ARRAY['valor_total', 'financial_statistics']
  );
  
  -- Generate statistics (existing logic)
  WITH monthly_data AS (
    SELECT 
      DATE_TRUNC('month', created_at) as month_date,
      EXTRACT(YEAR FROM created_at) as year,
      EXTRACT(MONTH FROM created_at) as month,
      COUNT(*) as total_orders,
      COALESCE(SUM(CASE WHEN status IN ('pago', 'ativo', 'pago_pendente_video', 'video_aprovado') THEN valor_total ELSE 0 END), 0) as monthly_revenue,
      COUNT(*) FILTER (WHERE status IN ('ativo', 'video_aprovado')) as active_orders,
      COUNT(*) FILTER (WHERE status IN ('pendente', 'pago_pendente_video')) as pending_orders
    FROM public.pedidos 
    WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
    GROUP BY DATE_TRUNC('month', created_at), EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
    ORDER BY month_date DESC
  ),
  user_data AS (
    SELECT 
      DATE_TRUNC('month', data_criacao) as month_date,
      COUNT(*) as total_users,
      SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', data_criacao) ROWS UNBOUNDED PRECEDING) as total_users_accumulated
    FROM public.users 
    WHERE data_criacao >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
    GROUP BY DATE_TRUNC('month', data_criacao)
  ),
  building_data AS (
    SELECT 
      DATE_TRUNC('month', created_at) as month_date,
      COUNT(*) as total_buildings,
      SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at) ROWS UNBOUNDED PRECEDING) as total_buildings_accumulated
    FROM public.buildings 
    WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
    GROUP BY DATE_TRUNC('month', created_at)
  ),
  panel_data AS (
    SELECT 
      DATE_TRUNC('month', created_at) as month_date,
      COUNT(*) as total_panels,
      SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at) ROWS UNBOUNDED PRECEDING) as total_panels_accumulated,
      COUNT(*) FILTER (WHERE status = 'online') as online_panels
    FROM public.painels 
    WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
    GROUP BY DATE_TRUNC('month', created_at)
  )
  SELECT json_build_object(
    'months', COALESCE(json_agg(
      json_build_object(
        'month_year', TO_CHAR(md.month_date, 'YYYY-MM'),
        'total_orders', COALESCE(md.total_orders, 0),
        'monthly_revenue', COALESCE(md.monthly_revenue, 0),
        'active_orders', COALESCE(md.active_orders, 0),
        'pending_orders', COALESCE(md.pending_orders, 0),
        'total_users', COALESCE(ud.total_users, 0),
        'total_users_accumulated', COALESCE(ud.total_users_accumulated, 0),
        'total_buildings', COALESCE(bd.total_buildings, 0),
        'total_buildings_accumulated', COALESCE(bd.total_buildings_accumulated, 0),
        'total_panels', COALESCE(pd.total_panels, 0),
        'total_panels_accumulated', COALESCE(pd.total_panels_accumulated, 0),
        'online_panels', COALESCE(pd.online_panels, 0)
      ) ORDER BY md.month_date DESC
    ), '[]'::json)
  ) INTO v_result
  FROM monthly_data md
  FULL OUTER JOIN user_data ud ON md.month_date = ud.month_date
  FULL OUTER JOIN building_data bd ON md.month_date = bd.month_date
  FULL OUTER JOIN panel_data pd ON md.month_date = pd.month_date;
  
  RETURN v_result;
END;
$$;

-- 5. Secure the mercadopago reconciliation function
CREATE OR REPLACE FUNCTION public.mercadopago_reconciliation_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_supabase_total numeric;
  v_webhook_transactions integer;
  v_missing_transactions integer;
  v_lost_revenue numeric := 0;
  v_result jsonb;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get user role
  SELECT role INTO v_user_role
  FROM public.users
  WHERE users.id = v_user_id;
  
  -- Only super_admins can access reconciliation data
  IF v_user_role != 'super_admin' THEN
    -- Log unauthorized access attempt
    PERFORM public.audit_financial_access(
      'pedidos',
      'reconciliation_access_denied',
      NULL,
      ARRAY['valor_total', 'financial_reconciliation']
    );
    
    RAISE EXCEPTION 'Access denied: Only super admins can access reconciliation data';
  END IF;
  
  -- Log authorized access
  PERFORM public.audit_financial_access(
    'pedidos',
    'reconciliation_access',
    NULL,
    ARRAY['valor_total', 'financial_reconciliation']
  );
  
  -- Calculate today's totals in Supabase
  SELECT COALESCE(SUM(valor_total), 0) INTO v_supabase_total
  FROM public.pedidos
  WHERE DATE(created_at) = CURRENT_DATE
  AND status IN ('pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado');
  
  -- Count webhook transactions received today
  SELECT COUNT(*) INTO v_webhook_transactions
  FROM public.webhook_logs
  WHERE DATE(created_at) = CURRENT_DATE
  AND origem LIKE '%mercadopago%'
  AND status = 'success';
  
  -- Identify potential missing transactions
  SELECT COUNT(*) INTO v_missing_transactions
  FROM public.webhook_logs w
  WHERE DATE(w.created_at) = CURRENT_DATE
  AND w.origem LIKE '%mercadopago%'
  AND w.status = 'success'
  AND NOT EXISTS (
    SELECT 1 FROM public.pedidos p
    WHERE DATE(p.created_at) = DATE(w.created_at)
    AND p.status IN ('pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado')
  );
  
  v_result := jsonb_build_object(
    'reconciliation_date', CURRENT_DATE,
    'supabase_total', v_supabase_total,
    'webhook_transactions', v_webhook_transactions,
    'missing_transactions', v_missing_transactions,
    'lost_revenue_estimate', v_lost_revenue,
    'discrepancy_detected', v_missing_transactions > 0,
    'reconciliation_status', CASE 
      WHEN v_missing_transactions = 0 THEN 'RECONCILED'
      WHEN v_missing_transactions <= 2 THEN 'MINOR_DISCREPANCY'
      ELSE 'MAJOR_DISCREPANCY'
    END,
    'timestamp', now()
  );
  
  -- Log reconciliation check
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'MERCADOPAGO_RECONCILIATION_CHECK_SECURE',
    format('Secure reconciliation check completed by %s: %s', v_user_id, v_result::text)
  );
  
  RETURN v_result;
END;
$$;

-- 6. Add trigger to audit direct pedidos table access
CREATE OR REPLACE FUNCTION public.pedidos_access_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sensitive_fields text[] := ARRAY['valor_total', 'log_pagamento', 'compliance_data', 'transaction_id'];
BEGIN
  -- Log access for SELECT operations
  IF TG_OP = 'SELECT' THEN
    PERFORM public.audit_financial_access(
      TG_TABLE_NAME,
      'direct_select',
      COALESCE(OLD.id, NEW.id),
      v_sensitive_fields
    );
  END IF;
  
  -- Log modifications
  IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
    PERFORM public.audit_financial_access(
      TG_TABLE_NAME,
      lower(TG_OP),
      COALESCE(OLD.id, NEW.id),
      v_sensitive_fields
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for pedidos table (but only for logged modifications, not selects to avoid performance issues)
DROP TRIGGER IF EXISTS pedidos_audit_trigger ON public.pedidos;
CREATE TRIGGER pedidos_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.pedidos_access_audit();

-- 7. Log this security enhancement
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'SECURITY_ENHANCEMENT_FINANCIAL_DATA',
  'Implemented comprehensive financial data access controls and audit logging'
);