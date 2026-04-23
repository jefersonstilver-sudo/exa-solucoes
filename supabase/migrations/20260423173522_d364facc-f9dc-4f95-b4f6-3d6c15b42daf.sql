ALTER TABLE public.sindicos_interessados
ADD COLUMN IF NOT EXISTS elevador_casa_maquinas text
CHECK (elevador_casa_maquinas IN ('sim','nao','nao_sei'));