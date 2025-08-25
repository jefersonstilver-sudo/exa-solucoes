-- Security fix for leads_produtora table
-- Ensure RLS is properly configured with stronger security

-- Ensure RLS is enabled
ALTER TABLE public.leads_produtora ENABLE ROW LEVEL SECURITY;

-- Drop existing potentially insecure policies
DROP POLICY IF EXISTS "Apenas admins podem atualizar leads" ON public.leads_produtora;
DROP POLICY IF EXISTS "Apenas admins podem inserir leads" ON public.leads_produtora;
DROP POLICY IF EXISTS "Apenas admins podem ver leads" ON public.leads_produtora;

-- Create secure RLS policies that only allow admin access
CREATE POLICY "Admin only select leads_produtora"
ON public.leads_produtora
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admin only update leads_produtora"
ON public.leads_produtora  
FOR UPDATE
TO authenticated
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

CREATE POLICY "Admin only insert leads_produtora"
ON public.leads_produtora
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Deny all delete operations for security
CREATE POLICY "Deny delete leads_produtora"
ON public.leads_produtora
FOR DELETE
TO authenticated
USING (false);