-- Corrigir role da conta Eduardo que foi criada incorretamente como client
UPDATE public.users 
SET role = 'admin'
WHERE email = 'eduardo@indexamidia.com.br' AND role = 'client';

-- Log da correção
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'ADMIN_ROLE_CORRECTION',
  'Corrigido role de eduardo@indexamidia.com.br de client para admin'
);