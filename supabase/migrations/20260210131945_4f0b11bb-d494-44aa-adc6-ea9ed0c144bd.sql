
-- Reset ALL logos scale_factor to 1.0
UPDATE public.logos SET scale_factor = 1.0;

-- Drop existing constraint and recreate with proper range
ALTER TABLE public.logos DROP CONSTRAINT IF EXISTS logos_scale_factor_check;
ALTER TABLE public.logos ADD CONSTRAINT logos_scale_factor_check CHECK (scale_factor >= 0.1 AND scale_factor <= 4.0);
