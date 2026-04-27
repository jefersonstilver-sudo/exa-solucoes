UPDATE public.buildings
SET nome = TRIM(nome)
WHERE id IN (
  '0077c002-fdd5-430a-8794-bedd66ff526a',
  '6d8d0f86-7ac4-438f-9f3b-dbc8263524ca'
)
AND nome <> TRIM(nome);