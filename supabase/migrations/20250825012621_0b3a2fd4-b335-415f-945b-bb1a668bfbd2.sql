-- Security fix for leads_produtora table
-- Ensure RLS is properly configured and add additional safeguards

-- First, check if RLS is enabled (it should be)
ALTER TABLE public.leads_produtora ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with stronger security
DROP POLICY IF EXISTS "Apenas admins podem atualizar leads" ON public.leads_produtora;
DROP POLICY IF EXISTS "Apenas admins podem inserir leads" ON public.leads_produtora;
DROP POLICY IF EXISTS "Apenas admins podem ver leads" ON public.leads_produtora;

-- Create more secure RLS policies
CREATE POLICY "Super secure admin only select leads_produtora"
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

CREATE POLICY "Super secure admin only update leads_produtora"
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

CREATE POLICY "Super secure admin only insert leads_produtora"
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

-- Completely deny delete operations for extra security
CREATE POLICY "Deny delete leads_produtora"
ON public.leads_produtora
FOR DELETE
TO authenticated
USING (false);

-- Add audit logging trigger for lead access
CREATE OR REPLACE FUNCTION public.log_lead_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'LEAD_PRODUTORA_ACCESS',
    format('User %s accessed lead data at %s', auth.uid(), now())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for SELECT operations (will log when data is accessed)
DROP TRIGGER IF EXISTS log_lead_access_trigger ON public.leads_produtora;
CREATE TRIGGER log_lead_access_trigger
  AFTER SELECT ON public.leads_produtora
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.log_lead_access();