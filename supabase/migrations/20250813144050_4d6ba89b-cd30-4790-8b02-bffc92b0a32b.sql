-- Add secure developer authentication system
CREATE TABLE IF NOT EXISTS public.developer_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on developer auth tokens
ALTER TABLE public.developer_auth_tokens ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage developer tokens
CREATE POLICY "Only super admins can manage developer tokens"
ON public.developer_auth_tokens
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Create function to generate secure developer token
CREATE OR REPLACE FUNCTION public.generate_developer_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');
  
  -- Store hash (expires in 24 hours)
  INSERT INTO public.developer_auth_tokens (token_hash, expires_at)
  VALUES (v_token_hash, now() + interval '24 hours');
  
  -- Return the actual token (only time it's shown)
  RETURN v_token;
END;
$$;

-- Create function to validate developer token
CREATE OR REPLACE FUNCTION public.validate_developer_token(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_token_hash TEXT;
BEGIN
  v_token_hash := encode(digest(p_token, 'sha256'), 'hex');
  
  RETURN EXISTS (
    SELECT 1 FROM public.developer_auth_tokens
    WHERE token_hash = v_token_hash
    AND expires_at > now()
    AND is_active = true
  );
END;
$$;

-- Create secure super admin check function
CREATE OR REPLACE FUNCTION public.is_super_admin_secure()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$;

-- Log the security enhancement
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'SECURITY_ENHANCEMENT',
  'Implemented secure developer authentication system - removed hardcoded credentials'
);