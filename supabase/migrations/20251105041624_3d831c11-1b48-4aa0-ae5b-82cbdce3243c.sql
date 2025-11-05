-- Adicionar chave primária à tabela user_sessions
ALTER TABLE public.user_sessions DROP CONSTRAINT IF EXISTS user_sessions_pkey;
ALTER TABLE public.user_sessions ADD PRIMARY KEY (session_id);

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity);