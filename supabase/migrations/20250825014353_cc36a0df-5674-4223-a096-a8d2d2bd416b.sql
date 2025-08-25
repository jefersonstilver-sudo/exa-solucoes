-- First, drop the existing function if it exists
DROP FUNCTION IF EXISTS public.log_financial_access(text,text,text[],uuid,text);

-- Create audit table for financial data access
CREATE TABLE IF NOT EXISTS public.financial_data_audit_logs (
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

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Super admins can access financial audit logs" ON public.financial_data_audit_logs;

-- Create policy: Only super admins can access audit logs
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