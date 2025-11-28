-- ============================================
-- MIGRATION: Criar tabela report_director_links
-- Vincula relatórios gerados a diretores específicos
-- ============================================

CREATE TABLE IF NOT EXISTS public.report_director_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.generated_reports(id) ON DELETE CASCADE,
  director_id UUID NOT NULL REFERENCES public.exa_alerts_directors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, director_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_report_director_links_report_id ON public.report_director_links(report_id);
CREATE INDEX IF NOT EXISTS idx_report_director_links_director_id ON public.report_director_links(director_id);

-- RLS Policies
ALTER TABLE public.report_director_links ENABLE ROW LEVEL SECURITY;

-- Service role tem acesso total
CREATE POLICY "Service role full access" 
ON public.report_director_links 
FOR ALL 
TO service_role 
USING (true);

-- Comentário
COMMENT ON TABLE public.report_director_links IS 'Vincula relatórios VAR gerados aos diretores que devem ter acesso';