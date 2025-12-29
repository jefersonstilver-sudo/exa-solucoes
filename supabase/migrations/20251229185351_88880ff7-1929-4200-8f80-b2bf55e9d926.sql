-- Tabela para histórico de navegação (auditoria premium)
CREATE TABLE IF NOT EXISTS public.session_navigation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  page_title TEXT,
  action_type TEXT DEFAULT 'page_view',
  action_details JSONB,
  time_spent_seconds INTEGER,
  scroll_depth INTEGER,
  clicks_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_nav_history_session ON session_navigation_history(session_id);
CREATE INDEX IF NOT EXISTS idx_nav_history_user ON session_navigation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nav_history_created ON session_navigation_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nav_history_path ON session_navigation_history(path);

-- Enable RLS
ALTER TABLE session_navigation_history ENABLE ROW LEVEL SECURITY;

-- Política para admins verem tudo
CREATE POLICY "Admins can view all navigation history"
  ON session_navigation_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- Política para usuários verem próprio histórico
CREATE POLICY "Users can view own navigation history"
  ON session_navigation_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política para inserir navegação (autenticados ou anônimos via session_id)
CREATE POLICY "Anyone can insert navigation history"
  ON session_navigation_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Função para limpar histórico antigo (90 dias)
CREATE OR REPLACE FUNCTION clean_old_navigation_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM session_navigation_history
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Adicionar campos faltantes na user_sessions se não existirem
DO $$
BEGIN
  -- Verificar e adicionar is_active
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- Verificar e adicionar terminated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'terminated_at'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN terminated_at TIMESTAMPTZ;
  END IF;

  -- Verificar e adicionar terminated_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'terminated_by'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN terminated_by UUID;
  END IF;
END $$;

-- Criar índice para sessões ativas
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = true;