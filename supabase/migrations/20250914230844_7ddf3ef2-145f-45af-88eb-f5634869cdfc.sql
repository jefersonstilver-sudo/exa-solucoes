-- Fix security vulnerability: Remove direct admin access to lead tables
-- This prevents potential data theft for spam campaigns

-- Remove permissive policy that allows super admins direct access to leads_exa
DROP POLICY IF EXISTS "Super admins can view all leads exa" ON public.leads_exa;

-- Remove permissive policies that allow admins direct access to leads_produtora  
DROP POLICY IF EXISTS "Admin only select leads_produtora" ON public.leads_produtora;
DROP POLICY IF EXISTS "Admin only insert leads_produtora" ON public.leads_produtora;
DROP POLICY IF EXISTS "Admin only update leads_produtora" ON public.leads_produtora;

-- Ensure all tables have only restrictive policies
-- leads_exa should only allow public form submissions and deny everything else
-- (the existing "Deny all direct access" policy should handle this)

-- leads_produtora should only allow public form submissions and deny everything else  
-- (the existing "Deny all direct access" policy should handle this)

-- Verify that access logging is working for all secure functions
-- This will help detect any unauthorized access attempts
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'SECURITY_HARDENING_APPLIED',
  'Removed direct admin access to lead tables - all access must now go through secure functions'
);