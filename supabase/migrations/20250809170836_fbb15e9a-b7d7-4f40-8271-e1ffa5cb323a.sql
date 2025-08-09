-- Create table for persistent geocoding cache
CREATE TABLE IF NOT EXISTS public.building_geocodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NULL,
  address TEXT NOT NULL,
  normalized_address TEXT NOT NULL,
  lat NUMERIC NULL,
  lng NUMERIC NULL,
  precision TEXT NULL,
  provider TEXT NULL,
  raw JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_building_geocode UNIQUE (building_id),
  CONSTRAINT uq_normalized_address UNIQUE (normalized_address)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_building_geocodes_building_id ON public.building_geocodes (building_id);
CREATE INDEX IF NOT EXISTS idx_building_geocodes_coords ON public.building_geocodes (lat, lng);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_building_geocodes_updated_at ON public.building_geocodes;
CREATE TRIGGER trg_building_geocodes_updated_at
BEFORE UPDATE ON public.building_geocodes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS and set basic policies (can be tightened later)
ALTER TABLE public.building_geocodes ENABLE ROW LEVEL SECURITY;

-- Public read access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'building_geocodes' AND policyname = 'Public can read building geocodes'
  ) THEN
    CREATE POLICY "Public can read building geocodes"
    ON public.building_geocodes
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Allow inserts via clients (edge function or app). Consider tightening later to service role only.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'building_geocodes' AND policyname = 'Anyone can insert building geocodes'
  ) THEN
    CREATE POLICY "Anyone can insert building geocodes"
    ON public.building_geocodes
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- Allow updates (e.g., to improve precision later)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'building_geocodes' AND policyname = 'Anyone can update building geocodes'
  ) THEN
    CREATE POLICY "Anyone can update building geocodes"
    ON public.building_geocodes
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;
