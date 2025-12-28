-- 1. Drop the existing constraint
ALTER TABLE public.buildings DROP CONSTRAINT IF EXISTS buildings_status_check;

-- 2. Add new constraint with all Notion statuses
ALTER TABLE public.buildings ADD CONSTRAINT buildings_status_check 
CHECK (status IN (
  'ativo', 
  'inativo', 
  'manutencao', 
  'instalacao', 
  'lead',
  'subir_nuc',
  'instalacao_internet',
  'troca_painel',
  'primeira_reuniao',
  'visita_tecnica'
));

-- 3. Add column for work time (horário de trabalho)
ALTER TABLE public.buildings ADD COLUMN IF NOT EXISTS notion_horario_trabalho TEXT;