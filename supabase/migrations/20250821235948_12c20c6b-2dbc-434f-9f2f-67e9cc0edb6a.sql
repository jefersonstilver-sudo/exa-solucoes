-- Add scale_factor field to logos table for size control
ALTER TABLE public.logos 
ADD COLUMN scale_factor DECIMAL(3,2) DEFAULT 1.0 CHECK (scale_factor >= 0.5 AND scale_factor <= 2.0);

-- Add comment for documentation
COMMENT ON COLUMN public.logos.scale_factor IS 'Scale factor for logo display size, range 0.5 to 2.0 (50% to 200%)';