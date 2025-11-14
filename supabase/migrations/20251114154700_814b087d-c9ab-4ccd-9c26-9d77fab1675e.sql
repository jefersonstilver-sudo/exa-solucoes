-- Criar bucket público para assets de email (logos, etc)
-- Isso mantém o bucket "arquivos" privado e seguro
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-assets',
  'email-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml']
);

-- Criar política para permitir leitura pública
CREATE POLICY "Public Access to Email Assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-assets');

-- Criar política para admins poderem fazer upload
CREATE POLICY "Admins can upload email assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'email-assets' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Criar política para admins poderem deletar
CREATE POLICY "Admins can delete email assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'email-assets' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);