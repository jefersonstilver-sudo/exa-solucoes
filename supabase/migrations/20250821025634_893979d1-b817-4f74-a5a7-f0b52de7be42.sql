
-- 1) Normaliza storage_bucket e storage_key a partir de file_url quando faltarem ou estiverem incompletos
WITH parsed AS (
  SELECT
    id,
    -- extrai o bucket do file_url (.../storage/v1/object/(public/)?<bucket>/<path>)
    regexp_replace(file_url, '.*?/storage/v1/object/(?:public/)?([^/]+)/.+$', '\1') AS bucket,
    -- extrai o caminho (path) bruto após o bucket
    regexp_replace(file_url, '.*?/storage/v1/object/(?:public/)?[^/]+/(.+)$', '\1') AS path_raw
  FROM public.logos
)
UPDATE public.logos AS l
SET
  storage_bucket = COALESCE(l.storage_bucket, p.bucket),
  storage_key = CASE
    -- se a storage_key estiver nula ou sem subpasta, substitui pelo caminho completo extraído do file_url
    WHEN l.storage_key IS NULL OR l.storage_key NOT LIKE '%/%'
      THEN replace(p.path_raw, '%20', ' ')  -- decode do espaço
    ELSE l.storage_key
  END,
  updated_at = now()
FROM parsed p
WHERE p.id = l.id;

-- 2) Opcional: garante que todas as storage_key que comecem com 'PAGINA%20PRINCIPAL%20LOGOS/' virem 'PAGINA PRINCIPAL LOGOS/'
UPDATE public.logos
SET storage_key = replace(storage_key, 'PAGINA%20PRINCIPAL%20LOGOS/', 'PAGINA PRINCIPAL LOGOS/')
WHERE storage_key LIKE 'PAGINA%PRINCIPAL%LOGOS/%';

-- 3) Habilita realtime robusto na tabela logos (se ainda não estiver ativo)
ALTER TABLE public.logos REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'logos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.logos;
  END IF;
END $$;
