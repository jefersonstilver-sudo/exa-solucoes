-- Permitir leitura pública das logos de cliente na proposta
CREATE POLICY "Allow public read access to proposal client logos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'arquivos' 
  AND (storage.foldername(name))[1] = 'proposal-client-logos'
);