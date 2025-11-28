-- Add phone verification columns to directors
ALTER TABLE exa_alerts_directors
ADD COLUMN IF NOT EXISTS telefone_verificado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verificado_em TIMESTAMPTZ;

-- Create verification codes table
CREATE TABLE IF NOT EXISTS exa_alerts_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_id UUID REFERENCES exa_alerts_directors(id) ON DELETE CASCADE,
  telefone TEXT NOT NULL,
  codigo TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verificado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_director ON exa_alerts_verification_codes(director_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_telefone ON exa_alerts_verification_codes(telefone);

-- Enable RLS
ALTER TABLE exa_alerts_verification_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Super admins can manage verification codes" ON exa_alerts_verification_codes;

-- RLS Policies for verification codes
CREATE POLICY "Super admins can manage verification codes"
ON exa_alerts_verification_codes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
);