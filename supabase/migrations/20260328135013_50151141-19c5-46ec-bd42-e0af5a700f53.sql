INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('public-assets', 'public-assets', true, 209715200)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for public-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-assets');

CREATE POLICY "Authenticated upload for public-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-assets');