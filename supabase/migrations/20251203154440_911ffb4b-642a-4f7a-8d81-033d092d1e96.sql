-- Create cortesia_codes table for WhatsApp validation codes
CREATE TABLE public.cortesia_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(4) NOT NULL,
  request_data JSONB NOT NULL,
  created_by UUID REFERENCES public.users(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  validated_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX idx_cortesia_codes_lookup ON public.cortesia_codes(id, code, expires_at);
CREATE INDEX idx_cortesia_codes_created_by ON public.cortesia_codes(created_by);

-- Enable RLS
ALTER TABLE public.cortesia_codes ENABLE ROW LEVEL SECURITY;

-- Policy for admin access
CREATE POLICY "Admin can manage cortesia codes" ON public.cortesia_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Add comment
COMMENT ON TABLE public.cortesia_codes IS 'Stores temporary validation codes for courtesy proposals';