-- =============================================
-- MÓDULO PROCESSOS & OPERAÇÃO - DATABASE SCHEMA
-- =============================================

-- 1. DEPARTAMENTOS (Áreas da empresa)
CREATE TABLE public.process_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT NOT NULL DEFAULT 'folder',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.process_departments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para departamentos
CREATE POLICY "Authenticated users can view departments"
ON public.process_departments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage departments"
ON public.process_departments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- 2. PROCESSOS
CREATE TABLE public.processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.process_departments(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'em_revisao', 'obsoleto')),
  current_version INTEGER DEFAULT 1,
  owner_id UUID REFERENCES auth.users(id),
  secondary_owners UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para processos
CREATE POLICY "Authenticated users can view processes"
ON public.processes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage processes"
ON public.processes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Índices para processos
CREATE INDEX idx_processes_department ON public.processes(department_id);
CREATE INDEX idx_processes_status ON public.processes(status);
CREATE INDEX idx_processes_code ON public.processes(code);

-- 3. VERSÕES DE PROCESSO
CREATE TABLE public.process_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  nodes_data JSONB NOT NULL DEFAULT '[]',
  edges_data JSONB NOT NULL DEFAULT '[]',
  viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}',
  changelog TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(process_id, version)
);

-- Enable RLS
ALTER TABLE public.process_versions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para versões
CREATE POLICY "Authenticated users can view process versions"
ON public.process_versions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage process versions"
ON public.process_versions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Índice para versões
CREATE INDEX idx_process_versions_process ON public.process_versions(process_id, version);

-- 4. NÓS DO PROCESSO (blocos do fluxograma)
CREATE TABLE public.process_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL CHECK (node_type IN ('start', 'end', 'step', 'decision', 'status', 'subprocess')),
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  title TEXT NOT NULL,
  description TEXT,
  script TEXT,
  checklist JSONB DEFAULT '[]',
  strategic_notes TEXT,
  alerts TEXT,
  best_practices TEXT,
  common_errors TEXT,
  file_urls TEXT[] DEFAULT '{}',
  audio_urls TEXT[] DEFAULT '{}',
  external_links JSONB DEFAULT '[]',
  internal_links JSONB DEFAULT '[]',
  style JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(process_id, version, node_id)
);

-- Enable RLS
ALTER TABLE public.process_nodes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para nós
CREATE POLICY "Authenticated users can view process nodes"
ON public.process_nodes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage process nodes"
ON public.process_nodes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Índices para nós
CREATE INDEX idx_process_nodes_process ON public.process_nodes(process_id, version);

-- 5. CONEXÕES ENTRE NÓS (edges)
CREATE TABLE public.process_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  edge_id TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  label TEXT,
  edge_type TEXT DEFAULT 'default',
  style JSONB DEFAULT '{}',
  animated BOOLEAN DEFAULT false,
  UNIQUE(process_id, version, edge_id)
);

-- Enable RLS
ALTER TABLE public.process_edges ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para edges
CREATE POLICY "Authenticated users can view process edges"
ON public.process_edges FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage process edges"
ON public.process_edges FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Índice para edges
CREATE INDEX idx_process_edges_process ON public.process_edges(process_id, version);

-- 6. EXECUÇÕES DE PROCESSO
CREATE TABLE public.process_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  process_version INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluido', 'cancelado', 'pausado')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.process_executions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para execuções
CREATE POLICY "Users can view own executions"
ON public.process_executions FOR SELECT
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid()
  AND users.role IN ('admin', 'super_admin')
));

CREATE POLICY "Users can create own executions"
ON public.process_executions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own executions"
ON public.process_executions FOR UPDATE
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid()
  AND users.role IN ('admin', 'super_admin')
));

-- Índices para execuções
CREATE INDEX idx_process_executions_user ON public.process_executions(user_id);
CREATE INDEX idx_process_executions_process ON public.process_executions(process_id);
CREATE INDEX idx_process_executions_status ON public.process_executions(status);

-- 7. PASSOS EXECUTADOS
CREATE TABLE public.execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES public.process_executions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  status TEXT DEFAULT 'nao_iniciado' CHECK (status IN ('nao_iniciado', 'em_andamento', 'concluido', 'pulado')),
  notes TEXT,
  audio_url TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  decision_taken TEXT
);

-- Enable RLS
ALTER TABLE public.execution_steps ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para passos
CREATE POLICY "Users can view own execution steps"
ON public.execution_steps FOR SELECT
USING (EXISTS (
  SELECT 1 FROM process_executions pe
  WHERE pe.id = execution_steps.execution_id
  AND (pe.user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  ))
));

CREATE POLICY "Users can manage own execution steps"
ON public.execution_steps FOR ALL
USING (EXISTS (
  SELECT 1 FROM process_executions pe
  WHERE pe.id = execution_steps.execution_id
  AND pe.user_id = auth.uid()
));

-- Índice para passos
CREATE INDEX idx_execution_steps_execution ON public.execution_steps(execution_id);

-- 8. SEED: Departamentos iniciais
INSERT INTO public.process_departments (name, color, icon, display_order) VALUES
  ('Vendas', '#3B82F6', 'TrendingUp', 0),
  ('Marketing', '#10B981', 'Megaphone', 1),
  ('Operação', '#F59E0B', 'Cog', 2),
  ('Atendimento', '#EF4444', 'Headphones', 3),
  ('Tecnologia', '#8B5CF6', 'Code', 4),
  ('Financeiro', '#F97316', 'DollarSign', 5),
  ('Expansão', '#78350F', 'Globe', 6),
  ('IA & Automação', '#1F2937', 'Bot', 7),
  ('Administrativo', '#6B7280', 'Building', 8);

-- 9. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_process_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_process_departments_updated_at
  BEFORE UPDATE ON public.process_departments
  FOR EACH ROW EXECUTE FUNCTION update_process_updated_at();

CREATE TRIGGER update_processes_updated_at
  BEFORE UPDATE ON public.processes
  FOR EACH ROW EXECUTE FUNCTION update_process_updated_at();

CREATE TRIGGER update_process_nodes_updated_at
  BEFORE UPDATE ON public.process_nodes
  FOR EACH ROW EXECUTE FUNCTION update_process_updated_at();