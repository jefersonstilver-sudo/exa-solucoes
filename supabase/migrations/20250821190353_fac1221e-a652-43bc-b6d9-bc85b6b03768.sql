-- Normalize existing logos with signed URLs to use proper storage_bucket/storage_key
UPDATE logos 
SET 
  storage_bucket = CASE 
    WHEN file_url ~ '/storage/v1/object/[^/]+/([^/]+)/' THEN 
      (regexp_match(file_url, '/storage/v1/object/[^/]+/([^/]+)/'))[1]
    ELSE storage_bucket
  END,
  storage_key = CASE 
    WHEN file_url ~ '/storage/v1/object/[^/]+/[^/]+/(.+)\?' THEN 
      regexp_replace((regexp_match(file_url, '/storage/v1/object/[^/]+/[^/]+/(.+)\?'))[1], '%20', ' ', 'g')
    ELSE storage_key
  END,
  file_url = CASE 
    WHEN file_url ~ 'token=' THEN ''
    ELSE file_url
  END,
  updated_at = NOW()
WHERE file_url ~ 'token=' 
  AND (storage_bucket IS NULL OR storage_key IS NULL);