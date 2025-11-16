-- Create storage bucket for video editor assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-editor-assets', 'video-editor-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Video editor assets are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own video editor assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own video editor assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own video editor assets" ON storage.objects;

-- Policy: Anyone can view public assets
CREATE POLICY "Video editor assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'video-editor-assets');

-- Policy: Authenticated users can upload their own assets
CREATE POLICY "Users can upload their own video editor assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'video-editor-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own assets
CREATE POLICY "Users can update their own video editor assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'video-editor-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own assets
CREATE POLICY "Users can delete their own video editor assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'video-editor-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);