-- Corrigir política RLS da tabela logos para incluir admin_marketing
DROP POLICY IF EXISTS "Admins can manage all logos" ON public.logos;

CREATE POLICY "Admins can manage all logos" ON public.logos
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() 
    AND users.role = ANY(ARRAY['admin', 'admin_marketing', 'super_admin'])
  )
);