-- Add storage_bucket and storage_key columns to logos table for better tracking
ALTER TABLE public.logos 
ADD COLUMN storage_bucket TEXT,
ADD COLUMN storage_key TEXT;

-- Create index for better performance when querying by storage info
CREATE INDEX idx_logos_storage_info ON public.logos(storage_bucket, storage_key);

-- Update existing logos to have storage info based on their file_url
UPDATE public.logos 
SET 
  storage_bucket = 'arquivos',
  storage_key = CASE 
    WHEN file_url LIKE '%PAGINA PRINCIPAL LOGOS%' THEN 
      regexp_replace(file_url, '.*PAGINA PRINCIPAL LOGOS/', 'PAGINA PRINCIPAL LOGOS/')
    ELSE 
      regexp_replace(file_url, '.*/', '')
  END
WHERE file_url IS NOT NULL AND file_url LIKE '%supabase%';