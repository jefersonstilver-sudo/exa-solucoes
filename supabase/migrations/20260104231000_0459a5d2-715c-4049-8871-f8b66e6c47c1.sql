-- Adicionar campos de bloqueio de usuário
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS blocked_by uuid REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS blocked_reason text;

-- Criar índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON public.users(is_blocked) WHERE is_blocked = true;

-- Log de bloqueio/desbloqueio
COMMENT ON COLUMN public.users.is_blocked IS 'Se o usuário está bloqueado de acessar o sistema';
COMMENT ON COLUMN public.users.blocked_at IS 'Data/hora do bloqueio';
COMMENT ON COLUMN public.users.blocked_by IS 'Admin que bloqueou o usuário';
COMMENT ON COLUMN public.users.blocked_reason IS 'Motivo do bloqueio';