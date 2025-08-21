-- Fix storage_key paths for existing logos to match actual file locations
UPDATE public.logos 
SET 
  storage_key = 'PAGINA PRINCIPAL LOGOS/' || LOWER(REPLACE(name, ' ', '')) || '.png',
  storage_bucket = 'arquivos'
WHERE storage_key IS NULL OR storage_bucket IS NULL;

-- Update specific logos with corrected storage keys based on likely file names
UPDATE public.logos SET storage_key = 'PAGINA PRINCIPAL LOGOS/jardins.png' WHERE name = 'Jardins';
UPDATE public.logos SET storage_key = 'PAGINA PRINCIPAL LOGOS/palladium.png' WHERE name = 'Palladium';  
UPDATE public.logos SET storage_key = 'PAGINA PRINCIPAL LOGOS/blues.png' WHERE name = 'Blues';
UPDATE public.logos SET storage_key = 'PAGINA PRINCIPAL LOGOS/atlantico.png' WHERE name = 'Atlantico';
UPDATE public.logos SET storage_key = 'PAGINA PRINCIPAL LOGOS/mirage.png' WHERE name = 'Mirage';
UPDATE public.logos SET storage_key = 'PAGINA PRINCIPAL LOGOS/theone.png' WHERE name = 'The One';
UPDATE public.logos SET storage_key = 'PAGINA PRINCIPAL LOGOS/metropole.png' WHERE name = 'Metropole';
UPDATE public.logos SET storage_key = 'PAGINA PRINCIPAL LOGOS/grandarama.png' WHERE name = 'Grand Arama';
UPDATE public.logos SET storage_key = 'PAGINA PRINCIPAL LOGOS/centerville.png' WHERE name = 'Centerville';
UPDATE public.logos SET storage_key = 'PAGINA PRINCIPAL LOGOS/torres.png' WHERE name = 'Torres';
UPDATE public.logos SET storage_key = 'PAGINA PRINCIPAL LOGOS/infinity.png' WHERE name = 'Infinity';
UPDATE public.logos SET storage_key = 'PAGINA PRINCIPAL LOGOS/ecolife.png' WHERE name = 'Eco Life';
UPDATE public.logos SET storage_key = 'PAGINA PRINCIPAL LOGOS/fachada.png' WHERE name = 'Fachada';