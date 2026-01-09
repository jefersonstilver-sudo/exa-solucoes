-- Create price validation logs table for audit trail
CREATE TABLE IF NOT EXISTS public.price_validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  building_ids UUID[],
  plan_months INTEGER NOT NULL,
  coupon_code TEXT,
  client_price NUMERIC(10,2) NOT NULL,
  server_price NUMERIC(10,2) NOT NULL,
  price_difference NUMERIC(10,2) NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT false,
  is_potential_fraud BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for quick fraud detection queries
CREATE INDEX idx_price_validation_logs_fraud 
  ON public.price_validation_logs(is_potential_fraud, created_at DESC);

-- Add index for user-based queries
CREATE INDEX idx_price_validation_logs_user 
  ON public.price_validation_logs(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.price_validation_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admin can read logs
CREATE POLICY "Super admins can view price validation logs" 
  ON public.price_validation_logs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Service role can insert logs (used by Edge Function)
CREATE POLICY "Service role can insert price validation logs"
  ON public.price_validation_logs
  FOR INSERT
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.price_validation_logs IS 
  'Audit log for server-side price validation. Records all price validation attempts to detect potential fraud or system issues.';