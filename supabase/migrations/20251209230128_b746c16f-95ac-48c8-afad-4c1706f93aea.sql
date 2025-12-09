-- Create uptime_records table to track 100% uptime periods
CREATE TABLE public.uptime_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  is_current BOOLEAN DEFAULT false,
  ended_by_device_id UUID REFERENCES public.devices(id),
  ended_by_device_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.uptime_records ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "Authenticated users can view uptime records"
ON public.uptime_records
FOR SELECT
TO authenticated
USING (true);

-- Allow insert/update for service role (edge functions)
CREATE POLICY "Service role can manage uptime records"
ON public.uptime_records
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_uptime_records_is_current ON public.uptime_records(is_current) WHERE is_current = true;
CREATE INDEX idx_uptime_records_started_at ON public.uptime_records(started_at DESC);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.uptime_records;

-- Insert initial record if all devices are currently online
INSERT INTO public.uptime_records (started_at, is_current)
SELECT now(), true
WHERE NOT EXISTS (
  SELECT 1 FROM public.devices 
  WHERE is_active = true AND status = 'offline'
);