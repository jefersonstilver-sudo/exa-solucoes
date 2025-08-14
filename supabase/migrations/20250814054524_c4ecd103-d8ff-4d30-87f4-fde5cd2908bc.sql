-- Adicionar novos campos para documentação e avatar na tabela users
ALTER TABLE public.users 
ADD COLUMN cpf TEXT,
ADD COLUMN documento_estrangeiro TEXT,
ADD COLUMN documento_frente_url TEXT,
ADD COLUMN documento_verso_url TEXT,
ADD COLUMN avatar_url TEXT,
ADD COLUMN tipo_documento TEXT DEFAULT 'cpf' CHECK (tipo_documento IN ('cpf', 'documento_estrangeiro'));

-- Criar bucket para avatars se não existir
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('avatars', 'avatars', true, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Criar bucket para documentos se não existir  
INSERT INTO storage.buckets (id, name, public, false, allowed_mime_types)
VALUES ('documents', 'documents', false, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para bucket avatars
CREATE POLICY "Users can view their own avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas RLS para bucket documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);