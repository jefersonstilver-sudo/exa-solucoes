-- Corrigir nome do usuário master para "Jeferson Stilver" (com 1 F)
UPDATE public.users 
SET nome = 'Jeferson Stilver' 
WHERE email = 'jefersonstilver@gmail.com';