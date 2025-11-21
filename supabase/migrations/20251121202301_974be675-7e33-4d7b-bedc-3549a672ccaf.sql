-- FASE 1: Adicionar visão AI
ALTER TABLE agents ADD COLUMN IF NOT EXISTS vision_enabled BOOLEAN DEFAULT false;

-- Habilitar visão para Sofia
UPDATE agents SET vision_enabled = true WHERE key = 'sofia';

-- FASE 4: Adicionar is_read para ordenação
ALTER TABLE zapi_logs 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Index para performance de queries não lidas
CREATE INDEX IF NOT EXISTS idx_zapi_logs_unread 
ON zapi_logs(phone_number, agent_key, is_read, created_at) 
WHERE direction = 'inbound';

-- FASE 2: Criar bucket para mídias do chat
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'chat-media', 
  'chat-media', 
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'video/mp4', 'video/webm', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Policies para o bucket chat-media
CREATE POLICY "Authenticated users can upload to chat-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-media');

CREATE POLICY "Anyone can view chat media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat-media');

CREATE POLICY "Authenticated users can delete their chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-media');