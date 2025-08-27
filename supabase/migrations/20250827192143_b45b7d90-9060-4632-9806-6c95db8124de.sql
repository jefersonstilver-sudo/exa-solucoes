-- Corrigir role do usuário allan@indexamidia.com.br
UPDATE public.users 
SET role = 'admin_marketing' 
WHERE email = 'allan@indexamidia.com.br';

-- Verificar se foi atualizado
SELECT email, role FROM public.users WHERE email = 'allan@indexamidia.com.br';