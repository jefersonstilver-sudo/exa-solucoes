-- Tabela para armazenar logs de relatórios gerados pela IA
CREATE TABLE IF NOT EXISTS public.ai_reports_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  report_type TEXT NOT NULL DEFAULT 'daily',
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_conversations INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  ai_insights JSONB,
  metrics JSONB,
  generated_by TEXT,
  file_size_kb INTEGER,
  generation_time_ms INTEGER
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_ai_reports_log_created_at ON public.ai_reports_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_reports_log_type ON public.ai_reports_log(report_type);

-- RLS policies
ALTER TABLE public.ai_reports_log ENABLE ROW LEVEL SECURITY;

-- Admin pode ver todos os relatórios
CREATE POLICY "Admin can view all reports"
  ON public.ai_reports_log
  FOR SELECT
  USING (true);

-- Sistema pode inserir relatórios
CREATE POLICY "System can insert reports"
  ON public.ai_reports_log
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE public.ai_reports_log IS 'Armazena logs de relatórios gerados pela IA para aprimoramento contínuo';