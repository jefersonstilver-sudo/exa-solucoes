-- Allow admins to insert and update buildings
CREATE POLICY "admins_manage_buildings" 
ON public.buildings 
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = auth.uid() 
  AND u.role IN ('admin', 'super_admin')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = auth.uid() 
  AND u.role IN ('admin', 'super_admin')
));