-- Create specific developer token for password 573039
-- Generate hash for "573039" and insert directly into tokens table
INSERT INTO public.developer_auth_tokens (token_hash, expires_at, is_active)
VALUES (
  encode(digest('573039', 'sha256'), 'hex'),
  now() + interval '30 days',
  true
);

-- Verify the token was created
SELECT token_hash, expires_at, is_active, created_at 
FROM public.developer_auth_tokens 
WHERE token_hash = encode(digest('573039', 'sha256'), 'hex');