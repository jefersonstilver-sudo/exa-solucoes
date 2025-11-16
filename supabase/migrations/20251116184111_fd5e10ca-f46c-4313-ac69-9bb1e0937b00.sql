-- Adiciona coluna para armazenar a data de aceite do termo de responsabilidade
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS empresa_aceite_termo_data timestamptz;