ALTER TABLE public.videos 
  ADD COLUMN IF NOT EXISTS trim_start_seconds numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trim_end_seconds numeric DEFAULT NULL;