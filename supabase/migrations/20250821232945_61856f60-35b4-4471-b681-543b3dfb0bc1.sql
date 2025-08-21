-- Fix storage RLS policies for arquivos bucket to allow super_admin uploads

-- Create policy for super_admin users to upload to arquivos bucket
CREATE POLICY "Super admins can upload to arquivos bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'arquivos' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Create policy for super_admin users to update files in arquivos bucket
CREATE POLICY "Super admins can update files in arquivos bucket" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'arquivos' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Create policy for super_admin users to delete files in arquivos bucket  
CREATE POLICY "Super admins can delete files in arquivos bucket"
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'arquivos' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Create policy for public read access to arquivos bucket (for logo display)
CREATE POLICY "Public can view files in arquivos bucket" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'arquivos');