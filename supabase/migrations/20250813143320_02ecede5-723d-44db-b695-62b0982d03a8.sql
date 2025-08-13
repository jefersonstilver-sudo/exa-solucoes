-- Secure homepage_banners: Restrict write operations to admin users only
-- Public users should only be able to read banners, not modify them

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "insert_policy" ON public.homepage_banners;
DROP POLICY IF EXISTS "update_policy" ON public.homepage_banners;
DROP POLICY IF EXISTS "delete_policy" ON public.homepage_banners;
DROP POLICY IF EXISTS "select_policy" ON public.homepage_banners;

-- Create secure policies
-- Public can read banners (needed for website display)
CREATE POLICY "Public can view homepage banners" 
ON public.homepage_banners 
FOR SELECT 
USING (true);

-- Only admins can insert banners
CREATE POLICY "Only admins can insert homepage banners" 
ON public.homepage_banners 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['admin', 'super_admin'])
  )
);

-- Only admins can update banners
CREATE POLICY "Only admins can update homepage banners" 
ON public.homepage_banners 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['admin', 'super_admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['admin', 'super_admin'])
  )
);

-- Only admins can delete banners
CREATE POLICY "Only admins can delete homepage banners" 
ON public.homepage_banners 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = ANY(ARRAY['admin', 'super_admin'])
  )
);