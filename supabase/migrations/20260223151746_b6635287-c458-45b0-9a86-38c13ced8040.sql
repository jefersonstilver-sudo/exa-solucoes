
-- Bulk sync existing proposal logos to contacts (one-time)
-- Uses DISTINCT ON to pick the most recent logo per contact
UPDATE public.contacts c
SET logo_url = sub.client_logo_url,
    updated_at = now()
FROM (
  SELECT DISTINCT ON (p.client_phone)
    p.client_phone,
    p.client_logo_url
  FROM public.proposals p
  WHERE p.client_logo_url IS NOT NULL
    AND p.client_logo_url != ''
    AND p.client_phone IS NOT NULL
  ORDER BY p.client_phone, p.created_at DESC
) sub
WHERE c.telefone = sub.client_phone
  AND (c.logo_url IS NULL OR c.logo_url = '');
