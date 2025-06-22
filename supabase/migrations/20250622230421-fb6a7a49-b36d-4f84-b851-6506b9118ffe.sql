
-- Primeiro, vamos ver qual é o constraint atual
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.pedidos'::regclass 
AND contype = 'c';

-- Remover o constraint atual de status
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;

-- Criar novo constraint que inclui 'tentativa'
ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_status_check 
CHECK (status IN ('pendente', 'pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'video_rejeitado', 'ativo', 'cancelado', 'cancelado_automaticamente', 'expirado', 'tentativa'));

-- Adicionar coluna email na tabela pedidos (se ainda não existe)
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS email text;

-- Migrar dados de tentativas_compra para pedidos
INSERT INTO public.pedidos (
  client_id,
  email,
  lista_paineis,
  valor_total,
  status,
  created_at,
  plano_meses,
  termos_aceitos
)
SELECT 
  tc.id_user as client_id,
  COALESCE(au.email, 'email@naoidentificado.com') as email,
  ARRAY(SELECT unnest(tc.predios_selecionados)::text) as lista_paineis,
  tc.valor_total,
  'tentativa' as status,
  tc.created_at,
  1 as plano_meses,
  false as termos_aceitos
FROM public.tentativas_compra tc
LEFT JOIN auth.users au ON au.id = tc.id_user;

-- Atualizar email em pedidos existentes baseado no client_id
UPDATE public.pedidos 
SET email = COALESCE(au.email, 'email@naoidentificado.com')
FROM auth.users au 
WHERE pedidos.client_id = au.id 
AND pedidos.email IS NULL;

-- Dropar a tabela tentativas_compra após migração
DROP TABLE IF EXISTS public.tentativas_compra;
