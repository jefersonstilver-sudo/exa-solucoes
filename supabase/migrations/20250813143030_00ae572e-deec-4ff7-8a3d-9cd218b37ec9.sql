-- Secure sindicos_interessados: Remove public insert access
-- Only admins should be able to insert directly into the table
-- Public submissions will go through a secure Edge Function

DROP POLICY IF EXISTS "Anyone can insert sindicos interessados" ON public.sindicos_interessados;

-- Create a more restrictive insert policy for admins only
CREATE POLICY "Only admins can insert sindicos interessados" 
ON public.sindicos_interessados 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['admin', 'super_admin'])
  )
);