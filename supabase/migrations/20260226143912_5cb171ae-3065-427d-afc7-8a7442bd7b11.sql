
-- Tabela time_sessions
CREATE TABLE public.time_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('stopwatch', 'timer', 'pomodoro')),
  label TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  laps JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_time_sessions_user_id ON public.time_sessions(user_id);
CREATE INDEX idx_time_sessions_created_at ON public.time_sessions(created_at);

-- RLS
ALTER TABLE public.time_sessions ENABLE ROW LEVEL SECURITY;

-- Politica: usuarios veem apenas suas proprias sessoes
CREATE POLICY "Users can view own sessions"
  ON public.time_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.time_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.time_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
