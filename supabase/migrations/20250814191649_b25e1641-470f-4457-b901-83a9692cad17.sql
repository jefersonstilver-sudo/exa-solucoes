-- Fix developer token functions to use correct sha256 syntax

-- Drop and recreate generate_developer_token function with correct hash syntax
DROP FUNCTION IF EXISTS public.generate_developer_token();

CREATE OR REPLACE FUNCTION public.generate_developer_token()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_token TEXT;
  v_token_hash TEXT;
BEGIN
  -- Only super admins can generate tokens
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only super admins can generate developer tokens';
  END IF;
  
  -- Generate secure random token
  v_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(sha256(v_token::bytea), 'hex');
  
  -- Store hash (expires in 24 hours)
  INSERT INTO public.developer_auth_tokens (token_hash, expires_at)
  VALUES (v_token_hash, now() + interval '24 hours');
  
  -- Return the actual token (only time it's shown)
  RETURN v_token;
END;
$function$;

-- Drop and recreate validate_developer_token function with correct hash syntax
DROP FUNCTION IF EXISTS public.validate_developer_token(text);

CREATE OR REPLACE FUNCTION public.validate_developer_token(p_token text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_token_hash TEXT;
BEGIN
  v_token_hash := encode(sha256(p_token::bytea), 'hex');
  
  RETURN EXISTS (
    SELECT 1 FROM public.developer_auth_tokens
    WHERE token_hash = v_token_hash
    AND expires_at > now()
    AND is_active = true
  );
END;
$function$;