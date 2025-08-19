-- Add missing building fields
ALTER TABLE public.buildings 
ADD COLUMN IF NOT EXISTS numero_andares integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS numero_elevadores integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS numero_blocos integer DEFAULT 1;