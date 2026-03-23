ALTER TABLE public.buildings DROP CONSTRAINT IF EXISTS buildings_status_check;
ALTER TABLE public.buildings ADD CONSTRAINT buildings_status_check 
  CHECK (status = ANY (ARRAY[
    'ativo', 'inativo', 'manutencao', 'instalacao', 'lead', 
    'subir_nuc', 'instalacao_internet', 'troca_painel', 
    'primeira_reuniao', 'visita_tecnica', 'interno'
  ]));