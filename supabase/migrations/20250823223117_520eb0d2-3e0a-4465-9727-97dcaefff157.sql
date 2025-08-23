-- Fix security issues with payment processing tables
-- Issue: Missing RLS policies for INSERT/UPDATE/DELETE on payment_status_tracking
-- Issue: Too permissive INSERT policy on payment_processing_control

-- First, drop the overly permissive INSERT policy on payment_processing_control
DROP POLICY IF EXISTS "System can insert payment processing control" ON public.payment_processing_control;

-- Create more restrictive policies for payment_processing_control
-- Only allow system functions and super admins to insert payment processing records
CREATE POLICY "Super admins can insert payment processing control" 
ON public.payment_processing_control 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Prevent unauthorized updates and deletes on payment_processing_control
CREATE POLICY "Super admins can update payment processing control" 
ON public.payment_processing_control 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super admins can delete payment processing control" 
ON public.payment_processing_control 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Secure payment_status_tracking table with complete RLS policies
-- Only super admins can insert payment status tracking records
CREATE POLICY "Super admins can insert payment status tracking" 
ON public.payment_status_tracking 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Only super admins can update payment status tracking records
CREATE POLICY "Super admins can update payment status tracking" 
ON public.payment_status_tracking 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Prevent deletion of payment status tracking records
CREATE POLICY "No one can delete payment status tracking" 
ON public.payment_status_tracking 
FOR DELETE 
TO authenticated
USING (false);

-- Create a secure function for system operations to insert payment processing records
-- This allows webhooks and system functions to record payment events securely
CREATE OR REPLACE FUNCTION public.log_payment_processing_secure(
  p_payment_id text,
  p_webhook_source text DEFAULT 'mercadopago',
  p_external_reference text DEFAULT NULL,
  p_pedido_id uuid DEFAULT NULL,
  p_amount numeric DEFAULT NULL,
  p_details jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_record_id uuid;
BEGIN
  -- This function can be called by system processes (webhooks, etc.)
  INSERT INTO public.payment_processing_control (
    payment_id,
    webhook_source,
    external_reference,
    pedido_id,
    amount,
    details
  ) VALUES (
    p_payment_id,
    p_webhook_source,
    p_external_reference,
    p_pedido_id,
    p_amount,
    p_details
  ) RETURNING id INTO v_record_id;
  
  RETURN v_record_id;
END;
$$;

-- Create a secure function for logging payment status changes
CREATE OR REPLACE FUNCTION public.log_payment_status_change_secure(
  p_pedido_id uuid,
  p_status_anterior text,
  p_status_novo text,
  p_origem text DEFAULT 'system',
  p_detalhes jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_record_id uuid;
BEGIN
  -- This function can be called by system processes
  INSERT INTO public.payment_status_tracking (
    pedido_id,
    status_anterior,
    status_novo,
    origem,
    detalhes
  ) VALUES (
    p_pedido_id,
    p_status_anterior,
    p_status_novo,
    p_origem,
    p_detalhes
  ) RETURNING id INTO v_record_id;
  
  RETURN v_record_id;
END;
$$;