
-- Adicionar colunas na tabela contact_notes
ALTER TABLE public.contact_notes 
  ADD COLUMN IF NOT EXISTS note_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS attachment_url text;

-- Criar bucket para anexos de contatos
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-attachments', 'contact-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Policy de upload para usuários autenticados
CREATE POLICY "Authenticated users can upload contact attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contact-attachments');

-- Policy de leitura pública
CREATE POLICY "Public read access for contact attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contact-attachments');

-- Policy de delete para autenticados
CREATE POLICY "Authenticated users can delete contact attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contact-attachments');
