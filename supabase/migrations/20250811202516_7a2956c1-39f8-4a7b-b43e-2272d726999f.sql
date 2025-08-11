-- Fix migration: safely (re)create admin SELECT policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'buildings' AND policyname = 'admins_view_buildings'
  ) THEN
    EXECUTE 'DROP POLICY admins_view_buildings ON public.buildings';
  END IF;
END $$;

CREATE POLICY admins_view_buildings
ON public.buildings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('admin','super_admin')
  )
);
