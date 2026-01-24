-- Criar bucket para gravações de voz
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-recordings', 'voice-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket
CREATE POLICY "Permitir leitura pública de gravações"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-recordings');

CREATE POLICY "Permitir upload de gravações por usuários autenticados"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-recordings' AND auth.role() = 'authenticated');

CREATE POLICY "Permitir upload anônimo para gravações"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-recordings');