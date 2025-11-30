
-- Tornar o bucket 'arquivos exa' público para permitir acesso direto aos vídeos
UPDATE storage.buckets 
SET public = true 
WHERE id = 'arquivos exa';

-- Remover política existente se houver
DROP POLICY IF EXISTS "Acesso público aos arquivos" ON storage.objects;

-- Criar política RLS para permitir leitura pública dos arquivos
CREATE POLICY "Acesso público aos arquivos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'arquivos exa');
