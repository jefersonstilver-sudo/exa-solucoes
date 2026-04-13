
-- Create device_groups table
CREATE TABLE public.device_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#6B7280',
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.device_groups ENABLE ROW LEVEL SECURITY;

-- Authenticated users can do everything
CREATE POLICY "Authenticated users can manage device_groups"
  ON public.device_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Anon can read (for /monitor public page)
CREATE POLICY "Anon users can read device_groups"
  ON public.device_groups FOR SELECT TO anon USING (true);

-- Add device_group_id column to devices
ALTER TABLE public.devices
  ADD COLUMN device_group_id UUID REFERENCES public.device_groups(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX idx_devices_device_group_id ON public.devices(device_group_id);
