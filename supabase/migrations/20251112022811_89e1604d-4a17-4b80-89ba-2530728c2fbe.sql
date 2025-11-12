-- Criar tabela para histórico de análises de debug com IA
CREATE TABLE ai_debug_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  page_path TEXT NOT NULL,
  page_url TEXT NOT NULL,
  
  -- Análise da IA
  ai_analysis JSONB NOT NULL,
  ai_model TEXT DEFAULT 'google/gemini-2.5-flash',
  tokens_used INTEGER,
  analysis_duration_ms INTEGER,
  
  -- Código analisado
  analyzed_components JSONB,
  analyzed_hooks JSONB,
  analyzed_services JSONB,
  
  -- Erros detectados
  detected_errors JSONB,
  error_severity TEXT CHECK (error_severity IN ('low', 'medium', 'high', 'critical')),
  error_count INTEGER DEFAULT 0,
  
  -- Sugestões
  suggestions JSONB,
  quick_fixes JSONB,
  
  -- Estado da página no momento
  page_state_snapshot JSONB,
  console_logs JSONB,
  network_calls JSONB,
  performance_metrics JSONB,
  
  -- Metadados
  user_agent TEXT,
  screen_resolution TEXT,
  browser_info JSONB,
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('analyzing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_ai_debug_user ON ai_debug_analysis_history(user_id);
CREATE INDEX idx_ai_debug_page ON ai_debug_analysis_history(page_path);
CREATE INDEX idx_ai_debug_created ON ai_debug_analysis_history(created_at DESC);
CREATE INDEX idx_ai_debug_severity ON ai_debug_analysis_history(error_severity);

-- RLS
ALTER TABLE ai_debug_analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins podem ver todos os logs de debug"
  ON ai_debug_analysis_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'super_admin'
    )
  );

CREATE POLICY "Sistema pode inserir análises de debug"
  ON ai_debug_analysis_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Atualizar tabela configuracoes_sistema
ALTER TABLE configuracoes_sistema 
ADD COLUMN IF NOT EXISTS debug_ai_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS debug_ai_activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS debug_ai_activated_by UUID REFERENCES auth.users(id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ai_debug_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_debug_analysis_updated_at
  BEFORE UPDATE ON ai_debug_analysis_history
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_debug_updated_at();