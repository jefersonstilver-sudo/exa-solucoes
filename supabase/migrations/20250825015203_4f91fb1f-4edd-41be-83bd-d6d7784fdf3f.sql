-- Remove the problematic audit logging policies and create simple, safe RLS policies

-- Step 1: Drop the problematic policies that cause INSERT during SELECT
DROP POLICY IF EXISTS "Enhanced secure select pedidos with audit" ON public.pedidos;
DROP POLICY IF EXISTS "Enhanced secure transaction sessions with audit" ON public.transaction_sessions;

-- Step 2: Create simple, safe RLS policies without automatic logging
CREATE POLICY "Users can view their own pedidos"
ON public.pedidos
FOR SELECT
USING (
  auth.uid() = client_id OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Users can view their own transaction sessions"
ON public.transaction_sessions
FOR SELECT
USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Step 3: Create a safer audit logging function that can be called explicitly when needed
CREATE OR REPLACE FUNCTION public.safe_log_financial_access(
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
  -- This function can be called explicitly when needed, not automatically during SELECT
  v_user_id := auth.uid();
  
  -- Get user role if user exists
  IF v_user_id IS NOT NULL THEN
    SELECT role INTO v_user_role
    FROM public.users
    WHERE id = v_user_id;
  END IF;
  
  -- Only log if not in a read-only context
  BEGIN
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
      true
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
    
  EXCEPTION
    WHEN OTHERS THEN
      -- If logging fails (e.g., read-only transaction), just continue
      -- Log the error but don't fail the entire operation
      RAISE NOTICE 'Financial access logging failed: %', SQLERRM;
  END;
  
  RETURN true;
END;
$$;