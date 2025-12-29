-- Add pode_agendar column to exa_alerts_directors if not exists
ALTER TABLE public.exa_alerts_directors 
ADD COLUMN IF NOT EXISTS pode_agendar boolean DEFAULT true;

-- Update existing records to have pode_agendar = true
UPDATE public.exa_alerts_directors 
SET pode_agendar = true 
WHERE pode_agendar IS NULL;