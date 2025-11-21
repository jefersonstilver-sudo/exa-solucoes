-- Criar bucket para mídias do chat (se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  true,
  52428800, -- 50MB
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/wav',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para chat-media
CREATE POLICY "Admins podem fazer upload de mídias"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Todos podem ver mídias públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-media');

CREATE POLICY "Admins podem deletar mídias"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-media');