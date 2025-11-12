-- ============================================
-- TABELA PARA CACHE DE TEMPLATES DE EMAIL
-- ============================================

-- Criar tabela para armazenar cache dos templates renderizados
CREATE TABLE IF NOT EXISTS public.email_templates_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT UNIQUE NOT NULL,
  template_name TEXT NOT NULL,
  html_content TEXT NOT NULL,
  version TEXT NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_email_templates_cache_template_id 
ON public.email_templates_cache(template_id);

CREATE INDEX IF NOT EXISTS idx_email_templates_cache_last_updated 
ON public.email_templates_cache(last_updated DESC);

-- RLS Policies
ALTER TABLE public.email_templates_cache ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver os templates em cache
CREATE POLICY "Admins podem visualizar templates em cache"
ON public.email_templates_cache
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin', 'admin_marketing')
  )
);

-- Apenas super_admins podem inserir/atualizar (via edge function com service role)
CREATE POLICY "Service role pode gerenciar templates em cache"
ON public.email_templates_cache
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Comentários
COMMENT ON TABLE public.email_templates_cache IS 'Cache de templates de email renderizados para garantir consistência';
COMMENT ON COLUMN public.email_templates_cache.template_id IS 'ID único do template (ex: confirmation, admin_welcome)';
COMMENT ON COLUMN public.email_templates_cache.template_name IS 'Nome amigável do template';
COMMENT ON COLUMN public.email_templates_cache.html_content IS 'Conteúdo HTML renderizado do template';
COMMENT ON COLUMN public.email_templates_cache.version IS 'Versão do template (timestamp de geração)';
COMMENT ON COLUMN public.email_templates_cache.last_updated IS 'Data da última atualização do template';